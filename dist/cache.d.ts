export interface CacheOptions {
    enabled?: boolean;
    directory?: string;
    maxSize?: number;
    maxAge?: number;
}
export declare class CacheManager {
    private directory;
    private maxSize;
    private maxAge;
    private enabled;
    private currentSize;
    private memoryCache;
    constructor(options?: CacheOptions);
    private initialize;
    private calculateCacheSize;
    private cleanExpiredEntries;
    private enforceMaxSize;
    private generateKey;
    /**
     * Attempts to retrieve a value from cache
     */
    get<T>(key: string, keyPrefix?: string): T | null;
    /**
     * Stores a value in the cache
     */
    set<T>(key: string, data: T, keyPrefix?: string): void;
    /**
     * Clears all cache entries
     */
    clear(): void;
    /**
     * Clears cache entries by prefix
     */
    clearByPrefix(prefix: string): void;
    /**
     * Gets cache stats
     */
    getStats(): {
        enabled: boolean;
        entries: number;
        sizeInMB: number;
        directory: string;
    };
}
export declare const cacheManager: CacheManager;
//# sourceMappingURL=cache.d.ts.map