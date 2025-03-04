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