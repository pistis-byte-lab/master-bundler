
import { EventEmitter } from 'events';
import { logger } from '../utils/logger';

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
export abstract class BaseTransformer extends EventEmitter {
  readonly name: string;
  readonly extensions: string[];
  
  constructor(options: TransformerOptions) {
    super();
    this.name = options.name;
    this.extensions = options.extensions || [];
    
    logger.debug(`Registered transformer: ${this.name} for extensions: ${this.extensions.join(', ')}`);
  }
  
  /**
   * Checks if this transformer can process the given file
   */
  canTransform(filePath: string): boolean {
    return this.extensions.some(ext => filePath.endsWith(ext));
  }
  
  /**
   * Pre-transform hook
   */
  async preTransform(context: TransformContext): Promise<TransformContext> {
    return context;
  }
  
  /**
   * Main transform method (must be implemented by subclasses)
   */
  abstract transform(context: TransformContext): Promise<TransformContext>;
  
  /**
   * Post-transform hook
   */
  async postTransform(context: TransformContext): Promise<TransformContext> {
    return context;
  }
  
  /**
   * Process a file through the complete transformation pipeline
   */
  async process(context: TransformContext): Promise<TransformContext> {
    try {
      // Pre-transform
      const preContext = await this.preTransform(context);
      
      // Main transform
      const transformedContext = await this.transform(preContext);
      
      // Post-transform
      const finalContext = await this.postTransform(transformedContext);
      
      return finalContext;
    } catch (error) {
      logger.error(`Transformer ${this.name} error:`, error);
      this.emit('error', error);
      throw error;
    }
  }
}
