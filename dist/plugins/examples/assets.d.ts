import { Plugin, PluginContext, PluginConfig } from '../types';
import { BundleOptions } from '../../types';
interface AssetPluginConfig extends PluginConfig {
    patterns: string[];
    outputDir?: string;
    flatten?: boolean;
    optimize?: {
        images?: boolean;
        quality?: number;
        maxWidth?: number;
        maxHeight?: number;
    };
    fingerprint?: {
        enabled?: boolean;
        algorithm?: 'md5' | 'sha1';
        length?: number;
        manifestPath?: string;
    };
}
export declare class AssetPlugin implements Plugin {
    name: string;
    private manifest;
    defaultConfig: AssetPluginConfig;
    private ensureDir;
    private getOutputPath;
    private generateFingerprint;
    private getFingerprintedPath;
    private isFontFile;
    private optimizeImage;
    setup(options: BundleOptions): void;
    beforeTransform(context: PluginContext): Promise<string>;
    cleanup(): void;
}
export {};
//# sourceMappingURL=assets.d.ts.map