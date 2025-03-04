import path from 'path';
import fs from 'fs';
import { BundleOptions } from './types';
import { logger } from './utils/logger';

export interface ConfigFile extends Omit<BundleOptions, 'input'> {
  entries?: string[];
  outDir?: string;
  plugins?: string[];
  exclude?: string[];
  tsconfig?: string;
}

const DEFAULT_CONFIG: Partial<ConfigFile> = {
  format: 'esm',
  minify: true,
  sourcemap: true,
  target: ['es2019'],
  external: [],
  globals: {},
};

export class Config {
  private static instance: Config;
  private config: ConfigFile;

  private constructor() {
    this.config = { ...DEFAULT_CONFIG };
  }

  public static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new Config();
    }
    return Config.instance;
  }

  public loadConfigFile(configPath?: string): void {
    const configFile = configPath || path.join(process.cwd(), 'ts-bundler.config.js');

    try {
      if (fs.existsSync(configFile)) {
        const userConfig = require(configFile);
        this.config = {
          ...DEFAULT_CONFIG,
          ...userConfig,
        };
        logger.info('Configuration loaded successfully');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.warning(`Failed to load config file: ${errorMessage}`);
      logger.info('Using default configuration');
    }
  }

  public mergeConfig(options: Partial<BundleOptions>): BundleOptions {
    if (!options.input) {
      throw new Error('Input file is required');
    }

    return {
      input: options.input,
      ...this.config,
      ...options,
      globals: {
        ...this.config.globals,
        ...options.globals,
      },
      external: [
        ...(this.config.external || []),
        ...(options.external || []),
      ],
    };
  }

  public getConfig(): ConfigFile {
    return { ...this.config };
  }

  public validateConfig(config: Partial<BundleOptions>): void {
    if (!config.input) {
      throw new Error('Input file is required');
    }

    if (config.format && !['esm', 'umd', 'cjs'].includes(config.format)) {
      throw new Error('Invalid format specified. Must be one of: esm, umd, cjs');
    }

    if (config.format === 'umd' && !config.name) {
      throw new Error('UMD format requires a name option');
    }

    if (config.external && !Array.isArray(config.external)) {
      throw new Error('External option must be an array');
    }

    if (config.globals && typeof config.globals !== 'object') {
      throw new Error('Globals option must be an object');
    }
  }

  public setConfig(newConfig: Partial<ConfigFile>): void {
    this.config = {
      ...this.config,
      ...newConfig,
    };
  }

  public reset(): void {
    this.config = { ...DEFAULT_CONFIG };
  }
}

export const config = Config.getInstance();

export function createDefaultConfig(input: string): BundleOptions {
  return {
    input,
    ...DEFAULT_CONFIG,
  };
}

export function resolveConfig(options: Partial<BundleOptions>): BundleOptions {
  const configInstance = Config.getInstance();
  const mergedConfig = configInstance.mergeConfig(options);
  configInstance.validateConfig(mergedConfig);
  return mergedConfig;
}