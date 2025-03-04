
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { logger } from './logger';

export interface CacheOptions {
  enabled: boolean;
  directory: string;
  ttl?: number; // Tempo de vida em milissegundos
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  dependencies?: string[];
}

export class CacheManager {
  private options: CacheOptions;
  private memoryCache: Map<string, CacheEntry<any>> = new Map();

  constructor(options: Partial<CacheOptions> = {}) {
    this.options = {
      enabled: options.enabled ?? true,
      directory: options.directory ?? path.join(process.cwd(), '.cache'),
      ttl: options.ttl ?? 24 * 60 * 60 * 1000, // 24 horas por padrão
    };

    // Criar diretório de cache se não existir
    if (this.options.enabled && !fs.existsSync(this.options.directory)) {
      try {
        fs.mkdirSync(this.options.directory, { recursive: true });
      } catch (error) {
        logger.warning(`Não foi possível criar o diretório de cache: ${error}`);
        this.options.enabled = false;
      }
    }
  }

  private generateKey(key: string): string {
    return crypto.createHash('md5').update(key).digest('hex');
  }

  private getCachePath(key: string): string {
    const hashedKey = this.generateKey(key);
    return path.join(this.options.directory, `${hashedKey}.json`);
  }

  private isExpired(timestamp: number): boolean {
    if (!this.options.ttl) return false;
    return Date.now() - timestamp > this.options.ttl;
  }

  private async dependenciesChanged(dependencies?: string[]): Promise<boolean> {
    if (!dependencies || dependencies.length === 0) return false;

    for (const dep of dependencies) {
      try {
        const stats = await fs.promises.stat(dep);
        const cacheEntry = this.memoryCache.get(dep);
        
        if (!cacheEntry || stats.mtimeMs > cacheEntry.timestamp) {
          return true;
        }
      } catch (error) {
        // Se não conseguimos verificar a dependência, assumimos que mudou
        return true;
      }
    }

    return false;
  }

  public async get<T>(key: string): Promise<T | null> {
    if (!this.options.enabled) return null;

    // Verificar cache em memória primeiro
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry) {
      if (!this.isExpired(memoryEntry.timestamp) && 
          !(await this.dependenciesChanged(memoryEntry.dependencies))) {
        return memoryEntry.data;
      }
      // Se expirou ou dependências mudaram, remover do cache em memória
      this.memoryCache.delete(key);
    }

    // Verificar cache em disco
    const cachePath = this.getCachePath(key);
    try {
      if (fs.existsSync(cachePath)) {
        const cacheData = await fs.promises.readFile(cachePath, 'utf-8');
        const cacheEntry: CacheEntry<T> = JSON.parse(cacheData);
        
        if (!this.isExpired(cacheEntry.timestamp) && 
            !(await this.dependenciesChanged(cacheEntry.dependencies))) {
          // Armazenar em cache de memória para acesso mais rápido
          this.memoryCache.set(key, cacheEntry);
          return cacheEntry.data;
        }
        
        // Se expirou ou dependências mudaram, remover do cache em disco
        await fs.promises.unlink(cachePath);
      }
    } catch (error) {
      logger.warning(`Erro ao ler cache para chave ${key}: ${error}`);
    }

    return null;
  }

  public async set<T>(key: string, data: T, dependencies?: string[]): Promise<void> {
    if (!this.options.enabled) return;

    const cacheEntry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      dependencies
    };

    // Armazenar em cache de memória
    this.memoryCache.set(key, cacheEntry);

    // Armazenar em cache de disco
    const cachePath = this.getCachePath(key);
    try {
      await fs.promises.writeFile(
        cachePath,
        JSON.stringify(cacheEntry),
        'utf-8'
      );
    } catch (error) {
      logger.warning(`Erro ao escrever cache para chave ${key}: ${error}`);
    }
  }

  public async invalidate(key: string): Promise<void> {
    if (!this.options.enabled) return;

    // Remover da memória
    this.memoryCache.delete(key);

    // Remover do disco
    const cachePath = this.getCachePath(key);
    try {
      if (fs.existsSync(cachePath)) {
        await fs.promises.unlink(cachePath);
      }
    } catch (error) {
      logger.warning(`Erro ao invalidar cache para chave ${key}: ${error}`);
    }
  }

  public async clear(): Promise<void> {
    if (!this.options.enabled) return;

    // Limpar cache de memória
    this.memoryCache.clear();

    // Limpar cache de disco
    try {
      const files = await fs.promises.readdir(this.options.directory);
      for (const file of files) {
        if (file.endsWith('.json')) {
          await fs.promises.unlink(path.join(this.options.directory, file));
        }
      }
    } catch (error) {
      logger.warning(`Erro ao limpar cache: ${error}`);
    }
  }
}

// Exportar uma instância padrão
export const cacheManager = new CacheManager();

// Função auxiliar para criar um gerenciador de cache com opções personalizadas
export function createCacheManager(options?: Partial<CacheOptions>): CacheManager {
  return new CacheManager(options);
}
