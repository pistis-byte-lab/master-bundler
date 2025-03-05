import { Plugin, PluginContext, PluginConfig } from '../types';
import { BundleOptions } from '../../types';
import { logger } from '../../utils/logger';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import crypto from 'crypto';

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

interface AssetManifest {
  [originalPath: string]: string;
}

export class AssetPlugin implements Plugin {
  name = 'assets';
  private manifest: AssetManifest = {};

  defaultConfig: AssetPluginConfig = {
    patterns: ['**/*.{png,jpg,jpeg,gif,svg,woff,woff2,ttf,eot}'],
    flatten: false,
    optimize: {
      images: true,
      quality: 80,
      maxWidth: 1920,
      maxHeight: 1080
    },
    fingerprint: {
      enabled: true,
      algorithm: 'md5',
      length: 8,
      manifestPath: 'asset-manifest.json'
    }
  };

  private ensureDir(dir: string): void {
    if (!fs.existsSync(dir)) {
      logger.info(`Creating directory: ${dir}`);
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private getOutputPath(sourcePath: string, config: AssetPluginConfig, options: BundleOptions): string {
    logger.info(`Computing output path for source: ${sourcePath}`);

    const outputDir = config.outputDir || 
      (options.outDir ? path.join(options.outDir, 'assets') : 'dist/assets');

    if (config.flatten) {
      const outputPath = path.join(outputDir, path.basename(sourcePath));
      logger.info(`Flattened output path: ${outputPath}`);
      return outputPath;
    }

    const assetDir = path.dirname(path.resolve(sourcePath));
    const assetName = path.basename(sourcePath);
    const sourceDirStructure = path.dirname(sourcePath).split(path.sep);
    const lastDir = sourceDirStructure[sourceDirStructure.length - 1];

    if (this.isFontFile(sourcePath)) {
      const fontOutputPath = path.join(outputDir, lastDir, assetName);
      logger.info(`Font output path: ${fontOutputPath}`);
      return fontOutputPath;
    }

    const outputPath = path.join(outputDir, assetName);
    logger.info(`Asset output path: ${outputPath}`);
    return outputPath;
  }

  private async generateFingerprint(filePath: string, config: AssetPluginConfig): Promise<string> {
    if (!config.fingerprint?.enabled) {
      return '';
    }

    const content = fs.readFileSync(filePath);
    const hash = crypto
      .createHash(config.fingerprint.algorithm || 'md5')
      .update(content)
      .digest('hex')
      .slice(0, config.fingerprint.length || 8);

    logger.info(`Generated fingerprint for ${filePath}: ${hash}`);
    return hash;
  }

  private getFingerprintedPath(originalPath: string, hash: string): string {
    const ext = path.extname(originalPath);
    const basePath = originalPath.slice(0, -ext.length);
    return `${basePath}.${hash}${ext}`;
  }

  private isFontFile(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return ['.woff', '.woff2', '.ttf', '.eot'].includes(ext);
  }

  private async optimizeImage(source: string, dest: string, config: AssetPluginConfig): Promise<void> {
    const ext = path.extname(source).toLowerCase();
    const isImage = ['.png', '.jpg', '.jpeg', '.gif'].includes(ext);

    if (!isImage || !config.optimize?.images) {
      fs.copyFileSync(source, dest);
      logger.info(`Copied asset: ${source} → ${dest}`);
      return;
    }

    try {
      const image = sharp(source);
      const metadata = await image.metadata();

      if (!metadata) {
        throw new Error('Could not read image metadata');
      }

      if (metadata.width && metadata.height) {
        const maxWidth = config.optimize?.maxWidth || 1920;
        const maxHeight = config.optimize?.maxHeight || 1080;

        if (metadata.width > maxWidth || metadata.height > maxHeight) {
          image.resize(maxWidth, maxHeight, {
            fit: 'inside',
            withoutEnlargement: true
          });
          logger.info(`Resizing image from ${metadata.width}x${metadata.height} to max ${maxWidth}x${maxHeight}`);
        }
      }

      if (ext === '.png') {
        await image
          .png({ quality: config.optimize?.quality || 80 })
          .toFile(dest);
      } else {
        await image
          .jpeg({ quality: config.optimize?.quality || 80 })
          .toFile(dest);
      }

      const optimizedMetadata = await sharp(dest).metadata();
      if (optimizedMetadata) {
        logger.info(`Optimized image: ${source} → ${dest} (${optimizedMetadata.width}x${optimizedMetadata.height})`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to optimize image ${source}: ${errorMessage}`);
      fs.copyFileSync(source, dest);
      logger.info(`Fallback: copied asset ${source} → ${dest}`);
    }
  }

  setup(options: BundleOptions): void {
    logger.info('Asset plugin setup');
    this.manifest = {};
  }

  async beforeTransform(context: PluginContext): Promise<string> {
    const { config, filePath, options } = context;

    if (!config?.patterns) {
      return context.content;
    }

    try {
      const isAsset = config.patterns.some((pattern: string) => {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(filePath);
      });

      if (!isAsset) {
        return context.content;
      }

      logger.info(`Processing asset file: ${filePath}`);
      logger.info(`Config: ${JSON.stringify(config, null, 2)}`);

      const hash = config.fingerprint?.enabled ? 
        await this.generateFingerprint(filePath, config as AssetPluginConfig) : '';

      let outputPath = this.getOutputPath(filePath, config as AssetPluginConfig, options);

      if (hash) {
        const fingerprintedPath = this.getFingerprintedPath(outputPath, hash);
        this.manifest[outputPath] = fingerprintedPath;
        outputPath = fingerprintedPath;
      }

      this.ensureDir(path.dirname(outputPath));

      if (this.isFontFile(filePath)) {
        logger.info(`Processing font file: ${filePath}`);
        fs.copyFileSync(filePath, outputPath);
        logger.info(`Copied font: ${filePath} → ${outputPath}`);
      } else {
        await this.optimizeImage(filePath, outputPath, config as AssetPluginConfig);
      }

      return context.content;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Error processing asset ${filePath}: ${errorMessage}`);
      throw error;
    }
  }

  cleanup(): void {
    logger.info('Asset plugin cleanup');
    const config = this.defaultConfig;

    if (config.fingerprint?.enabled && Object.keys(this.manifest).length > 0) {
      const manifestPath = path.join(process.cwd(), config.fingerprint.manifestPath || 'asset-manifest.json');
      fs.writeFileSync(manifestPath, JSON.stringify(this.manifest, null, 2));
      logger.info(`Asset manifest written to: ${manifestPath}`);
    }
  }
}