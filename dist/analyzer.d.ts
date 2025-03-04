import { BuildResult } from './types';
import { BundleOptions } from './types';
export interface AnalyzerOptions {
    outputFile?: string;
    visualize?: boolean;
    openBrowser?: boolean;
}
export interface ModuleInfo {
    id: string;
    file: string;
    size: number;
    gzipSize?: number;
    dependencies: string[];
    exports: string[];
    isExternal: boolean;
}
export interface ChunkInfo {
    id: string;
    name: string;
    size: number;
    gzipSize?: number;
    modules: ModuleInfo[];
}
export interface BundleAnalysis {
    totalSize: number;
    totalGzipSize?: number;
    chunks: ChunkInfo[];
    files: string[];
    timestamp: number;
    buildTime: number;
}
export declare function analyzeBuild(result: BuildResult, options: BundleOptions, analyzerOptions?: AnalyzerOptions): Promise<BundleAnalysis>;
//# sourceMappingURL=analyzer.d.ts.map