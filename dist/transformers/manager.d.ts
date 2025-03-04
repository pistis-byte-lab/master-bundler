import { BaseTransformer, TransformContext } from './base';
export declare class TransformerManager {
    private transformers;
    constructor();
    /**
     * Register a transformer
     */
    registerTransformer(transformer: BaseTransformer): void;
    /**
     * Unregister a transformer by name
     */
    unregisterTransformer(name: string): boolean;
    /**
     * Get a transformer by name
     */
    getTransformer(name: string): BaseTransformer | undefined;
    /**
     * Find transformers that can process the given file
     */
    findTransformersForFile(filePath: string): BaseTransformer[];
    /**
     * Process a file through appropriate transformers
     */
    processFile(filePath: string, content: string, options?: Record<string, any>): Promise<TransformContext>;
    /**
     * Get all registered transformers
     */
    getAllTransformers(): BaseTransformer[];
}
export declare const transformerManager: TransformerManager;
//# sourceMappingURL=manager.d.ts.map