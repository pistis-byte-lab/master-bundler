import { Plugin, PluginContext } from '../types';
import { logger } from '../../utils/logger';
import * as sass from 'sass';
import postcss from 'postcss';
import cssnano from 'cssnano';
import autoprefixer from 'autoprefixer';

export class CSSPlugin implements Plugin {
  name = 'css';
  private postcssProcessor: postcss.Processor;

  constructor() {
    this.postcssProcessor = postcss([
      autoprefixer,
      cssnano({
        preset: ['default', {
          discardComments: { removeAll: true },
          normalizeWhitespace: true
        }]
      })
    ]);
  }

  setup(options: any): void {
    logger.info('CSS plugin setup');
  }

  async transform(context: PluginContext): Promise<string> {
    const { filePath, content } = context;

    // Only process .css and .scss files
    if (!filePath.endsWith('.css') && !filePath.endsWith('.scss')) {
      return content;
    }

    // Handle empty files
    if (!content.trim()) {
      return '';
    }

    try {
      logger.info(`Processing ${filePath}`);

      // Compile SCSS to CSS if needed
      let css = content;
      if (filePath.endsWith('.scss')) {
        logger.info('Compiling SCSS to CSS');
        const result = sass.compileString(content, {
          sourceMap: true,
          sourceMapIncludeSources: true,
          style: 'expanded'
        });
        css = result.css.toString();
        logger.info('SCSS compilation complete');
      }

      // Process with PostCSS (autoprefixer + minification)
      logger.info('Running PostCSS transformations');
      const result = await this.postcssProcessor.process(css, {
        from: filePath,
        to: filePath.replace('.scss', '.css'),
        map: { inline: true }
      });

      logger.success(`Processed ${filePath}`);
      return result.css;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Error processing ${filePath}: ${errorMessage}`);
      throw error;
    }
  }

  cleanup(): void {
    logger.info('CSS plugin cleanup');
  }
}
import fs from 'fs';
import path from 'path';
import { Plugin, TransformResult } from '../types';

interface CssPluginOptions {
  /**
   * If true, CSS is injected into the page via a style tag.
   * If false, CSS is kept as a separate file.
   */
  inject?: boolean;
  
  /**
   * If true, CSS is minified
   */
  minify?: boolean;
  
  /**
   * Custom output file name pattern
   */
  fileName?: string;
  
  /**
   * Files to include
   */
  include?: string | RegExp | Array<string | RegExp>;
  
  /**
   * Files to exclude
   */
  exclude?: string | RegExp | Array<string | RegExp>;
}

/**
 * A plugin for handling CSS files
 */
export default class CssPlugin implements Plugin {
  name = 'css-plugin';
  private options: CssPluginOptions;
  private cssContents: Map<string, string> = new Map();
  
  constructor(options: CssPluginOptions = {}) {
    this.options = {
      inject: true,
      minify: true,
      fileName: 'styles.css',
      ...options
    };
  }
  
  /**
   * Configure the plugin with new options
   */
  configure(ctx: any, config: CssPluginOptions): void {
    this.options = { ...this.options, ...config };
    ctx.warn(`CSS plugin configured: ${JSON.stringify(this.options)}`);
  }
  
  /**
   * Resolve .css file imports
   */
  resolveId(ctx: any, source: string, importer: string): string | null {
    if (!source.endsWith('.css')) {
      return null;
    }
    
    // Handle relative imports
    if (source.startsWith('.')) {
      const resolvedPath = path.resolve(path.dirname(importer), source);
      return resolvedPath;
    }
    
    return null;
  }
  
  /**
   * Load .css files
   */
  load(ctx: any, id: string): { code: string } | null {
    if (!id.endsWith('.css')) {
      return null;
    }
    
    // Check if we should process this file
    if (!this.shouldProcess(id)) {
      return null;
    }
    
    try {
      const css = fs.readFileSync(id, 'utf-8');
      this.cssContents.set(id, css);
      
      if (this.options.inject) {
        // For injection, return a JS module that will inject the styles
        return {
          code: `
            const css = ${JSON.stringify(css)};
            
            // Function to inject CSS
            function injectCss(css) {
              if (typeof document !== 'undefined') {
                const style = document.createElement('style');
                style.setAttribute('type', 'text/css');
                style.textContent = css;
                document.head.appendChild(style);
              }
            }
            
            // Inject the CSS
            injectCss(css);
            
            export default css;
          `
        };
      } else {
        // For extraction, return an empty module
        return {
          code: 'export default "";'
        };
      }
    } catch (error: any) {
      ctx.error(`Failed to load CSS file: ${id}\n${error.message}`);
      return null;
    }
  }
  
  /**
   * Transform .css files
   */
  transform(ctx: any, code: string, id: string): TransformResult | null {
    if (!id.endsWith('.css') || !this.shouldProcess(id)) {
      return null;
    }
    
    // Store the CSS content for later extraction
    if (!this.options.inject) {
      this.cssContents.set(id, code);
    }
    
    // Process CSS
    let processedCss = code;
    
    // Apply minification if needed
    if (this.options.minify) {
      processedCss = this.minifyCss(processedCss);
    }
    
    if (this.options.inject) {
      // For injection, return a JS module that will inject the styles
      return {
        code: `
          const css = ${JSON.stringify(processedCss)};
          
          // Function to inject CSS
          function injectCss(css) {
            if (typeof document !== 'undefined') {
              const style = document.createElement('style');
              style.setAttribute('type', 'text/css');
              style.textContent = css;
              document.head.appendChild(style);
            }
          }
          
          // Inject the CSS
          injectCss(css);
          
          export default css;
        `
      };
    } else {
      // For extraction, return an empty module
      this.cssContents.set(id, processedCss);
      return {
        code: 'export default "";'
      };
    }
  }
  
  /**
   * Generate the bundle with extracted CSS
   */
  generateBundle(ctx: any, outputOptions: any, bundle: any): void {
    // Skip if we're injecting the CSS
    if (this.options.inject || this.cssContents.size === 0) {
      return;
    }
    
    // Concatenate all CSS
    let css = '';
    for (const contents of this.cssContents.values()) {
      css += contents + '\n';
    }
    
    // Minify if requested
    if (this.options.minify) {
      css = this.minifyCss(css);
    }
    
    // Generate filename 
    const fileName = this.options.fileName || 'styles.css';
    
    // Emit the file
    ctx.emitFile(fileName, css);
    ctx.warn(`CSS extracted to ${fileName} (${css.length} bytes)`);
  }
  
  /**
   * Simple CSS minification
   */
  private minifyCss(css: string): string {
    return css
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
      .replace(/\s+/g, ' ')            // Collapse whitespace
      .replace(/\s*([{}:;,])\s*/g, '$1') // Remove spaces around separators
      .replace(/;\}/g, '}')            // Remove trailing semicolons
      .trim();
  }
  
  /**
   * Check if we should process this file
   */
  private shouldProcess(id: string): boolean {
    // Check excludes
    if (this.options.exclude) {
      const excludes = Array.isArray(this.options.exclude) 
        ? this.options.exclude 
        : [this.options.exclude];
        
      for (const pattern of excludes) {
        if (typeof pattern === 'string' && id.includes(pattern)) {
          return false;
        }
        if (pattern instanceof RegExp && pattern.test(id)) {
          return false;
        }
      }
    }
    
    // Check includes
    if (this.options.include) {
      const includes = Array.isArray(this.options.include) 
        ? this.options.include 
        : [this.options.include];
        
      // If includes are specified, file must match one of them
      let matched = false;
      for (const pattern of includes) {
        if (typeof pattern === 'string' && id.includes(pattern)) {
          matched = true;
          break;
        }
        if (pattern instanceof RegExp && pattern.test(id)) {
          matched = true;
          break;
        }
      }
      
      if (!matched) {
        return false;
      }
    }
    
    return true;
  }
}
