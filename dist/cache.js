"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheManager = exports.CacheManager = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const logger_1 = require("./utils/logger");
const os_1 = __importDefault(require("os"));
class CacheManager {
    constructor(options = {}) {
        this.currentSize = 0;
        this.memoryCache = new Map();
        this.enabled = options.enabled !== false;
        this.directory = options.directory || path_1.default.join(os_1.default.tmpdir(), 'ts-bundler-cache');
        this.maxSize = (options.maxSize || 500) * 1024 * 1024; // Convert to bytes
        this.maxAge = options.maxAge || 7 * 24 * 60 * 60 * 1000; // 1 week default
        if (this.enabled) {
            this.initialize();
        }
    }
    initialize() {
        try {
            if (!fs_1.default.existsSync(this.directory)) {
                fs_1.default.mkdirSync(this.directory, { recursive: true });
            }
            // Calculate current cache size
            this.calculateCacheSize();
            // Clean up expired entries
            this.cleanExpiredEntries();
            logger_1.logger.debug(`Cache initialized at ${this.directory} (${(this.currentSize / 1024 / 1024).toFixed(2)} MB)`);
        }
        catch (error) {
            logger_1.logger.warn(`Failed to initialize cache: ${error.message}`);
            this.enabled = false;
        }
    }
    calculateCacheSize() {
        this.currentSize = 0;
        if (!this.enabled || !fs_1.default.existsSync(this.directory)) {
            return;
        }
        try {
            const files = fs_1.default.readdirSync(this.directory);
            for (const file of files) {
                const filePath = path_1.default.join(this.directory, file);
                try {
                    const stats = fs_1.default.statSync(filePath);
                    this.currentSize += stats.size;
                }
                catch (error) {
                    logger_1.logger.debug(`Could not get stats for ${filePath}: ${error.message}`);
                }
            }
        }
        catch (error) {
            logger_1.logger.warn(`Failed to calculate cache size: ${error.message}`);
        }
    }
    cleanExpiredEntries() {
        if (!this.enabled || !fs_1.default.existsSync(this.directory)) {
            return;
        }
        try {
            const now = Date.now();
            const files = fs_1.default.readdirSync(this.directory);
            for (const file of files) {
                const filePath = path_1.default.join(this.directory, file);
                try {
                    const stats = fs_1.default.statSync(filePath);
                    const age = now - stats.mtimeMs;
                    if (age > this.maxAge) {
                        fs_1.default.unlinkSync(filePath);
                        this.currentSize -= stats.size;
                        logger_1.logger.debug(`Removed expired cache entry: ${file}`);
                    }
                }
                catch (error) {
                    logger_1.logger.debug(`Could not process ${filePath}: ${error.message}`);
                }
            }
        }
        catch (error) {
            logger_1.logger.warn(`Failed to clean expired entries: ${error.message}`);
        }
        // Also clean memory cache
        const now = Date.now();
        for (const [key, entry] of this.memoryCache.entries()) {
            if (now - entry.timestamp > this.maxAge) {
                this.memoryCache.delete(key);
            }
        }
    }
    enforceMaxSize() {
        if (!this.enabled || !fs_1.default.existsSync(this.directory) || this.currentSize <= this.maxSize) {
            return;
        }
        try {
            const files = fs_1.default.readdirSync(this.directory)
                .map(file => {
                const filePath = path_1.default.join(this.directory, file);
                try {
                    const stats = fs_1.default.statSync(filePath);
                    return { file, path: filePath, size: stats.size, mtime: stats.mtimeMs };
                }
                catch (error) {
                    return { file, path: filePath, size: 0, mtime: 0 };
                }
            })
                .sort((a, b) => a.mtime - b.mtime); // Sort by age (oldest first)
            let index = 0;
            while (this.currentSize > this.maxSize * 0.8 && index < files.length) { // Aim to reduce to 80% of max
                const { path: filePath, size } = files[index++];
                try {
                    fs_1.default.unlinkSync(filePath);
                    this.currentSize -= size;
                    logger_1.logger.debug(`Removed cache entry to enforce max size: ${filePath}`);
                }
                catch (error) {
                    logger_1.logger.debug(`Could not remove ${filePath}: ${error.message}`);
                }
            }
        }
        catch (error) {
            logger_1.logger.warn(`Failed to enforce max cache size: ${error.message}`);
        }
    }
    generateKey(data, keyPrefix) {
        // Create a deterministic representation of the data
        const str = typeof data === 'string' ? data : JSON.stringify(data);
        const hash = crypto_1.default.createHash('md5').update(str).digest('hex');
        return keyPrefix ? `${keyPrefix}-${hash}` : hash;
    }
    /**
     * Attempts to retrieve a value from cache
     */
    get(key, keyPrefix) {
        if (!this.enabled) {
            return null;
        }
        const fullKey = keyPrefix ? `${keyPrefix}-${key}` : key;
        // Try memory cache first
        const memoryEntry = this.memoryCache.get(fullKey);
        if (memoryEntry) {
            // Check if expired
            if (Date.now() - memoryEntry.timestamp <= this.maxAge) {
                logger_1.logger.debug(`Memory cache hit: ${fullKey}`);
                return memoryEntry.data;
            }
            else {
                // Entry expired
                this.memoryCache.delete(fullKey);
            }
        }
        // Try file cache
        try {
            const cacheFile = path_1.default.join(this.directory, fullKey);
            if (fs_1.default.existsSync(cacheFile)) {
                const stats = fs_1.default.statSync(cacheFile);
                // Check if expired
                if (Date.now() - stats.mtimeMs > this.maxAge) {
                    fs_1.default.unlinkSync(cacheFile);
                    this.currentSize -= stats.size;
                    return null;
                }
                // Read from cache
                const data = JSON.parse(fs_1.default.readFileSync(cacheFile, 'utf8'));
                // Store in memory cache for faster access next time
                this.memoryCache.set(fullKey, { data, timestamp: Date.now() });
                logger_1.logger.debug(`File cache hit: ${fullKey}`);
                return data;
            }
        }
        catch (error) {
            logger_1.logger.debug(`Cache get error for ${fullKey}: ${error.message}`);
        }
        return null;
    }
    /**
     * Stores a value in the cache
     */
    set(key, data, keyPrefix) {
        if (!this.enabled) {
            return;
        }
        const fullKey = keyPrefix ? `${keyPrefix}-${key}` : key;
        // Store in memory cache
        this.memoryCache.set(fullKey, { data, timestamp: Date.now() });
        // Store in file cache
        try {
            const cacheFile = path_1.default.join(this.directory, fullKey);
            const json = JSON.stringify(data);
            fs_1.default.writeFileSync(cacheFile, json, 'utf8');
            // Update cache size tracking
            const stats = fs_1.default.statSync(cacheFile);
            this.currentSize += stats.size;
            logger_1.logger.debug(`Cached ${fullKey} (${(stats.size / 1024).toFixed(2)} KB)`);
            // Enforce max cache size
            this.enforceMaxSize();
        }
        catch (error) {
            logger_1.logger.debug(`Cache set error for ${fullKey}: ${error.message}`);
        }
    }
    /**
     * Clears all cache entries
     */
    clear() {
        if (!this.enabled || !fs_1.default.existsSync(this.directory)) {
            return;
        }
        try {
            const files = fs_1.default.readdirSync(this.directory);
            for (const file of files) {
                try {
                    fs_1.default.unlinkSync(path_1.default.join(this.directory, file));
                }
                catch (error) {
                    logger_1.logger.debug(`Could not delete ${file}: ${error.message}`);
                }
            }
            this.currentSize = 0;
            this.memoryCache.clear();
            logger_1.logger.debug('Cache cleared');
        }
        catch (error) {
            logger_1.logger.warn(`Failed to clear cache: ${error.message}`);
        }
    }
    /**
     * Clears cache entries by prefix
     */
    clearByPrefix(prefix) {
        if (!this.enabled || !fs_1.default.existsSync(this.directory)) {
            return;
        }
        try {
            const files = fs_1.default.readdirSync(this.directory);
            for (const file of files) {
                if (file.startsWith(prefix)) {
                    try {
                        const filePath = path_1.default.join(this.directory, file);
                        const stats = fs_1.default.statSync(filePath);
                        fs_1.default.unlinkSync(filePath);
                        this.currentSize -= stats.size;
                    }
                    catch (error) {
                        logger_1.logger.debug(`Could not delete ${file}: ${error.message}`);
                    }
                }
            }
            // Clear memory cache entries with prefix
            for (const key of this.memoryCache.keys()) {
                if (key.startsWith(prefix)) {
                    this.memoryCache.delete(key);
                }
            }
            logger_1.logger.debug(`Cache entries with prefix ${prefix} cleared`);
        }
        catch (error) {
            logger_1.logger.warn(`Failed to clear cache by prefix: ${error.message}`);
        }
    }
    /**
     * Gets cache stats
     */
    getStats() {
        let entries = 0;
        if (this.enabled && fs_1.default.existsSync(this.directory)) {
            try {
                entries = fs_1.default.readdirSync(this.directory).length;
            }
            catch (error) {
                logger_1.logger.debug(`Could not count cache entries: ${error.message}`);
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
exports.CacheManager = CacheManager;
// Create singleton instance
exports.cacheManager = new CacheManager();
//# sourceMappingURL=cache.js.map