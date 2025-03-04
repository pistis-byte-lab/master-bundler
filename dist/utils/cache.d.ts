export interface CacheOptions {
    enabled: boolean;
    directory: string;
    ttl?: number;
}
export interface CacheEntry<T> {
    data: T;
    timestamp: number;
    dependencies?: string[];
}
export declare class CacheManager {
    private options;
    private memoryCache;
    constructor(options?: Partial<CacheOptions>);
    private generateKey;
    private getCachePath;
    private isExpired;
    private dependenciesChanged;
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, data: T, dependencies?: string[]): Promise<void>;
    invalidate(key: string): Promise<void>;
    clear(): Promise<void>;
}
export declare const cacheManager: CacheManager;
export declare function createCacheManager(options?: Partial<CacheOptions>): CacheManager;
//# sourceMappingURL=cache.d.ts.map