
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { logger } from './utils/logger';
import os from 'os';

export interface CacheOptions {
  enabled?: boolean;
  directory?: string;
  maxSize?: number; // in MB
  maxAge?: number; // in ms
}

export class CacheManager {
  private directory: string;
  private maxSize: number;
  private maxAge: number;
  private enabled: boolean;
  private currentSize: number = 0;
  private memoryCache: Map<string, { data: any, timestamp: number }> = new Map();
  
  constructor(options: CacheOptions = {}) {
    this.enabled = options.enabled !== false;
    this.directory = options.directory || path.join(os.tmpdir(), 'ts-bundler-cache');
    this.maxSize = (options.maxSize || 500) * 1024 * 1024; // Convert to bytes
    this.maxAge = options.maxAge || 7 * 24 * 60 * 60 * 1000; // 1 week default
    
    if (this.enabled) {
      this.initialize();
    }
  }
  
  private initialize(): void {
    try {
      if (!fs.existsSync(this.directory)) {
        fs.mkdirSync(this.directory, { recursive: true });
      }
      
      // Calculate current cache size
      this.calculateCacheSize();
      
      // Clean up expired entries
      this.cleanExpiredEntries();
      
      logger.debug(`Cache initialized at ${this.directory} (${(this.currentSize / 1024 / 1024).toFixed(2)} MB)`);
    } catch (error) {
      logger.warn(`Failed to initialize cache: ${error.message}`);
      this.enabled = false;
    }
  }
  
  private calculateCacheSize(): void {
    this.currentSize = 0;
    
    if (!this.enabled || !fs.existsSync(this.directory)) {
      return;
    }
    
    try {
      const files = fs.readdirSync(this.directory);
      
      for (const file of files) {
        const filePath = path.join(this.directory, file);
        
        try {
          const stats = fs.statSync(filePath);
          this.currentSize += stats.size;
        } catch (error) {
          logger.debug(`Could not get stats for ${filePath}: ${error.message}`);
        }
      }
    } catch (error) {
      logger.warn(`Failed to calculate cache size: ${error.message}`);
    }
  }
  
  private cleanExpiredEntries(): void {
    if (!this.enabled || !fs.existsSync(this.directory)) {
      return;
    }
    
    try {
      const now = Date.now();
      const files = fs.readdirSync(this.directory);
      
      for (const file of files) {
        const filePath = path.join(this.directory, file);
        
        try {
          const stats = fs.statSync(filePath);
          const age = now - stats.mtimeMs;
          
          if (age > this.maxAge) {
            fs.unlinkSync(filePath);
            this.currentSize -= stats.size;
            logger.debug(`Removed expired cache entry: ${file}`);
          }
        } catch (error) {
          logger.debug(`Could not process ${filePath}: ${error.message}`);
        }
      }
    } catch (error) {
      logger.warn(`Failed to clean expired entries: ${error.message}`);
    }
    
    // Also clean memory cache
    const now = Date.now();
    for (const [key, entry] of this.memoryCache.entries()) {
      if (now - entry.timestamp > this.maxAge) {
        this.memoryCache.delete(key);
      }
    }
  }
  
  private enforceMaxSize(): void {
    if (!this.enabled || !fs.existsSync(this.directory) || this.currentSize <= this.maxSize) {
      return;
    }
    
    try {
      const files = fs.readdirSync(this.directory)
        .map(file => {
          const filePath = path.join(this.directory, file);
          try {
            const stats = fs.statSync(filePath);
            return { file, path: filePath, size: stats.size, mtime: stats.mtimeMs };
          } catch (error) {
            return { file, path: filePath, size: 0, mtime: 0 };
          }
        })
        .sort((a, b) => a.mtime - b.mtime); // Sort by age (oldest first)
      
      let index = 0;
      while (this.currentSize > this.maxSize * 0.8 && index < files.length) { // Aim to reduce to 80% of max
        const { path: filePath, size } = files[index++];
        
        try {
          fs.unlinkSync(filePath);
          this.currentSize -= size;
          logger.debug(`Removed cache entry to enforce max size: ${filePath}`);
        } catch (error) {
          logger.debug(`Could not remove ${filePath}: ${error.message}`);
        }
      }
    } catch (error) {
      logger.warn(`Failed to enforce max cache size: ${error.message}`);
    }
  }
  
  private generateKey(data: any, keyPrefix?: string): string {
    // Create a deterministic representation of the data
    const str = typeof data === 'string' ? data : JSON.stringify(data);
    const hash = crypto.createHash('md5').update(str).digest('hex');
    return keyPrefix ? `${keyPrefix}-${hash}` : hash;
  }
  
  /**
   * Attempts to retrieve a value from cache
   */
  get<T>(key: string, keyPrefix?: string): T | null {
    if (!this.enabled) {
      return null;
    }
    
    const fullKey = keyPrefix ? `${keyPrefix}-${key}` : key;
    
    // Try memory cache first
    const memoryEntry = this.memoryCache.get(fullKey);
    if (memoryEntry) {
      // Check if expired
      if (Date.now() - memoryEntry.timestamp <= this.maxAge) {
        logger.debug(`Memory cache hit: ${fullKey}`);
        return memoryEntry.data;
      } else {
        // Entry expired
        this.memoryCache.delete(fullKey);
      }
    }
    
    // Try file cache
    try {
      const cacheFile = path.join(this.directory, fullKey);
      
      if (fs.existsSync(cacheFile)) {
        const stats = fs.statSync(cacheFile);
        
        // Check if expired
        if (Date.now() - stats.mtimeMs > this.maxAge) {
          fs.unlinkSync(cacheFile);
          this.currentSize -= stats.size;
          return null;
        }
        
        // Read from cache
        const data = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
        
        // Store in memory cache for faster access next time
        this.memoryCache.set(fullKey, { data, timestamp: Date.now() });
        
        logger.debug(`File cache hit: ${fullKey}`);
        return data;
      }
    } catch (error) {
      logger.debug(`Cache get error for ${fullKey}: ${error.message}`);
    }
    
    return null;
  }
  
  /**
   * Stores a value in the cache
   */
  set<T>(key: string, data: T, keyPrefix?: string): void {
    if (!this.enabled) {
      return;
    }
    
    const fullKey = keyPrefix ? `${keyPrefix}-${key}` : key;
    
    // Store in memory cache
    this.memoryCache.set(fullKey, { data, timestamp: Date.now() });
    
    // Store in file cache
    try {
      const cacheFile = path.join(this.directory, fullKey);
      const json = JSON.stringify(data);
      
      fs.writeFileSync(cacheFile, json, 'utf8');
      
      // Update cache size tracking
      const stats = fs.statSync(cacheFile);
      this.currentSize += stats.size;
      
      logger.debug(`Cached ${fullKey} (${(stats.size / 1024).toFixed(2)} KB)`);
      
      // Enforce max cache size
      this.enforceMaxSize();
    } catch (error) {
      logger.debug(`Cache set error for ${fullKey}: ${error.message}`);
    }
  }
  
  /**
   * Clears all cache entries
   */
  clear(): void {
    if (!this.enabled || !fs.existsSync(this.directory)) {
      return;
    }
    
    try {
      const files = fs.readdirSync(this.directory);
      
      for (const file of files) {
        try {
          fs.unlinkSync(path.join(this.directory, file));
        } catch (error) {
          logger.debug(`Could not delete ${file}: ${error.message}`);
        }
      }
      
      this.currentSize = 0;
      this.memoryCache.clear();
      
      logger.debug('Cache cleared');
    } catch (error) {
      logger.warn(`Failed to clear cache: ${error.message}`);
    }
  }
  
  /**
   * Clears cache entries by prefix
   */
  clearByPrefix(prefix: string): void {
    if (!this.enabled || !fs.existsSync(this.directory)) {
      return;
    }
    
    try {
      const files = fs.readdirSync(this.directory);
      
      for (const file of files) {
        if (file.startsWith(prefix)) {
          try {
            const filePath = path.join(this.directory, file);
            const stats = fs.statSync(filePath);
            fs.unlinkSync(filePath);
            this.currentSize -= stats.size;
          } catch (error) {
            logger.debug(`Could not delete ${file}: ${error.message}`);
          }
        }
      }
      
      // Clear memory cache entries with prefix
      for (const key of this.memoryCache.keys()) {
        if (key.startsWith(prefix)) {
          this.memoryCache.delete(key);
        }
      }
      
      logger.debug(`Cache entries with prefix ${prefix} cleared`);
    } catch (error) {
      logger.warn(`Failed to clear cache by prefix: ${error.message}`);
    }
  }
  
  /**
   * Gets cache stats
   */
  getStats(): { enabled: boolean; entries: number; sizeInMB: number; directory: string } {
    let entries = 0;
    
    if (this.enabled && fs.existsSync(this.directory)) {
      try {
        entries = fs.readdirSync(this.directory).length;
      } catch (error) {
        logger.debug(`Could not count cache entries: ${error.message}`);
      }
    }
    
    return {
      enabled: this.enabled,
      entries,
      sizeInMB: this.currentSize / 1024 / 1024,
      directory: this.directory
    };
  }
}

// Create singleton instance
export const cacheManager = new CacheManager();
