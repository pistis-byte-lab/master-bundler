import { EventEmitter } from 'events';
export interface TransformContext {
    filePath: string;
    content: string;
    options: Record<string, any>;
    [key: string]: any;
}
export interface TransformerOptions {
    name: string;
    extensions: string[];
    [key: string]: any;
}
/**
 * Base class for custom transformers
 */
export declare abstract class BaseTransformer extends EventEmitter {
    readonly name: string;
    readonly extensions: string[];
    constructor(options: TransformerOptions);
    /**
     * Checks if this transformer can process the given file
     */
    canTransform(filePath: string): boolean;
    /**
     * Pre-transform hook
     */
    preTransform(context: TransformContext): Promise<TransformContext>;
    /**
     * Main transform method (must be implemented by subclasses)
     */
    abstract transform(context: TransformContext): Promise<TransformContext>;
    /**
     * Post-transform hook
     */
    postTransform(context: TransformContext): Promise<TransformContext>;
    /**
     * Process a file through the complete transformation pipeline
     */
    process(context: TransformContext): Promise<TransformContext>;
}
//# sourceMappingURL=base.d.ts.map