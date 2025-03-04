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
import fs from 'fs';
import path from 'path';
import { BundleOptions } from './types';
import { logger } from './utils/logger';
import dotenv from 'dotenv';

interface EnvConfig {
  [key: string]: string;
}

export interface FullConfig extends BundleOptions {
  plugins?: string[];
  pluginOptions?: Record<string, any>;
  env?: EnvConfig;
  environments?: {
    [env: string]: Partial<BundleOptions>;
  };
}

export function loadConfig(configPath?: string): FullConfig {
  const defaultConfigPaths = [
    'bundler.config.js',
    'bundler.config.json',
    'bundler.config.ts'
  ];
  
  let resolvedConfigPath = configPath;
  
  // If no config path provided, try to find one
  if (!resolvedConfigPath) {
    for (const p of defaultConfigPaths) {
      if (fs.existsSync(p)) {
        resolvedConfigPath = p;
        break;
      }
    }
  }
  
  if (!resolvedConfigPath || !fs.existsSync(resolvedConfigPath)) {
    logger.warn('No configuration file found, using defaults');
    return {} as FullConfig;
  }
  
  try {
    let config: FullConfig;
    
    if (resolvedConfigPath.endsWith('.js')) {
      config = require(path.resolve(resolvedConfigPath));
    } else if (resolvedConfigPath.endsWith('.json')) {
      const fileContent = fs.readFileSync(resolvedConfigPath, 'utf8');
      config = JSON.parse(fileContent);
    } else if (resolvedConfigPath.endsWith('.ts')) {
      // For TS configs, we'll need to use ts-node to require it
      require('ts-node').register({
        transpileOnly: true,
        compilerOptions: { module: 'commonjs' }
      });
      config = require(path.resolve(resolvedConfigPath));
    } else {
      throw new Error(`Unsupported config file format: ${resolvedConfigPath}`);
    }
    
    // Load environment variables
    loadEnvironmentVariables(config);
    
    // Apply environment-specific configuration
    applyEnvironmentConfig(config);
    
    validateConfig(config);
    
    return config;
  } catch (error) {
    logger.error(`Failed to load config from ${resolvedConfigPath}:`, error);
    throw new Error(`Failed to load config: ${error.message}`);
  }
}

function loadEnvironmentVariables(config: FullConfig): void {
  // Load from .env file
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envResult = dotenv.config({ path: envPath });
    if (envResult.error) {
      logger.warn(`Error loading .env file: ${envResult.error.message}`);
    } else {
      logger.debug('Loaded environment variables from .env file');
    }
  }
  
  // Override with environment-specific .env file
  const nodeEnv = process.env.NODE_ENV || 'development';
  const envSpecificPath = path.resolve(process.cwd(), `.env.${nodeEnv}`);
  if (fs.existsSync(envSpecificPath)) {
    const envResult = dotenv.config({ path: envSpecificPath });
    if (envResult.error) {
      logger.warn(`Error loading .env.${nodeEnv} file: ${envResult.error.message}`);
    } else {
      logger.debug(`Loaded environment variables from .env.${nodeEnv} file`);
    }
  }
  
  // Add custom env variables from config
  if (config.env) {
    for (const [key, value] of Object.entries(config.env)) {
      process.env[key] = value;
    }
  }
}

function applyEnvironmentConfig(config: FullConfig): void {
  const nodeEnv = process.env.NODE_ENV || 'development';
  
  // Apply environment-specific configuration if available
  if (config.environments && config.environments[nodeEnv]) {
    const envConfig = config.environments[nodeEnv];
    logger.info(`Applying ${nodeEnv} environment configuration`);
    
    // Merge the environment-specific config with the base config
    Object.assign(config, envConfig);
  }
}

function validateConfig(config: FullConfig): void {
  if (!config.input && !config.input) {
    logger.warn('No input file specified in config');
  }
  
  if (config.format && !['esm', 'umd', 'cjs'].includes(config.format)) {
    logger.warn(`Invalid format: ${config.format}. Using default 'esm' format.`);
    config.format = 'esm';
  }
  
  if (config.minify !== undefined && typeof config.minify !== 'boolean') {
    logger.warn(`Invalid minify option: ${config.minify}. Using default 'false'.`);
    config.minify = false;
  }
  
  // More validations can be added here
}
