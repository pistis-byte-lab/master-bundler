
import { BaseTransformer, TransformContext } from './base';
import { TypeScriptTransformer } from './typescript';
import { logger } from '../utils/logger';
import path from 'path';

export class TransformerManager {
  private transformers: BaseTransformer[] = [];
  
  constructor() {
    // Register built-in transformers
    this.registerTransformer(new TypeScriptTransformer());
  }
  
  /**
   * Register a transformer
   */
  registerTransformer(transformer: BaseTransformer): void {
    // Check if a transformer with this name already exists
    const existing = this.transformers.findIndex(t => t.name === transformer.name);
    
    if (existing >= 0) {
      // Replace the existing transformer
      this.transformers[existing] = transformer;
      logger.debug(`Replaced transformer: ${transformer.name}`);
    } else {
      // Add new transformer
      this.transformers.push(transformer);
      logger.debug(`Registered transformer: ${transformer.name}`);
    }
  }
  
  /**
   * Unregister a transformer by name
   */
  unregisterTransformer(name: string): boolean {
    const initialLength = this.transformers.length;
    this.transformers = this.transformers.filter(t => t.name !== name);
    
    const removed = initialLength !== this.transformers.length;
    
    if (removed) {
      logger.debug(`Unregistered transformer: ${name}`);
    }
    
    return removed;
  }
  
  /**
   * Get a transformer by name
   */
  getTransformer(name: string): BaseTransformer | undefined {
    return this.transformers.find(t => t.name === name);
  }
  
  /**
   * Find transformers that can process the given file
   */
  findTransformersForFile(filePath: string): BaseTransformer[] {
    return this.transformers.filter(transformer => transformer.canTransform(filePath));
  }
  
  /**
   * Process a file through appropriate transformers
   */
  async processFile(
    filePath: string, 
    content: string, 
    options: Record<string, any> = {}
  ): Promise<TransformContext> {
    // Find transformers that can handle this file
    const transformers = this.findTransformersForFile(filePath);
    
    if (transformers.length === 0) {
      logger.debug(`No transformers found for ${path.basename(filePath)}`);
      return { filePath, content, options };
    }
    
    logger.debug(`Found ${transformers.length} transformers for ${path.basename(filePath)}`);
    
    // Create initial context
    let context: TransformContext = {
      filePath,
      content,
      options
    };
    
    // Run file through each transformer in sequence
    for (const transformer of transformers) {
      context = await transformer.process(context);
    }
    
    return context;
  }
  
  /**
   * Get all registered transformers
   */
  getAllTransformers(): BaseTransformer[] {
    return [...this.transformers];
  }
}

// Create singleton instance
export const transformerManager = new TransformerManager();
