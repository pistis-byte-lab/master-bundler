export interface ModuleInfo {
    id: string;
    name: string;
    size: number;
    dependencies: string[];
    dependents: string[];
    isExternal: boolean;
}
export interface BundleAnalysis {
    totalSize: number;
    modules: ModuleInfo[];
    chunks: {
        id: string;
        name: string;
        size: number;
        modules: string[];
    }[];
    entryPoints: string[];
}
export declare class BundleAnalyzer {
    private analysis;
    constructor();
    analyzeBundleFromStats(statsFilePath: string): Promise<BundleAnalysis>;
    analyzeBundleFromObject(stats: any): BundleAnalysis;
    generateReport(outputPath: string): Promise<void>;
    private generateHTMLReport;
    private formatSize;
    private truncatePath;
}
export declare function createBundleAnalyzer(): BundleAnalyzer;
//# sourceMappingURL=analyzer.d.ts.map