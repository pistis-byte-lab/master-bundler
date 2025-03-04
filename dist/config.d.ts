import { BundleOptions } from './types';
export interface ConfigFile extends Omit<BundleOptions, 'input'> {
    entries?: string[];
    outDir?: string;
    plugins?: string[];
    exclude?: string[];
    tsconfig?: string;
}
export declare class Config {
    private static instance;
    private config;
    private constructor();
    static getInstance(): Config;
    loadConfigFile(configPath?: string): void;
    mergeConfig(options: Partial<BundleOptions>): BundleOptions;
    getConfig(): ConfigFile;
    validateConfig(config: Partial<BundleOptions>): void;
    setConfig(newConfig: Partial<ConfigFile>): void;
    reset(): void;
}
export declare const config: Config;
export declare function createDefaultConfig(input: string): BundleOptions;
export declare function resolveConfig(options: Partial<BundleOptions>): BundleOptions;
//# sourceMappingURL=config.d.ts.map