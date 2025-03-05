import path from 'path';
import fs from 'fs';
import { BundleOptions } from './types';
import { logger } from './utils/logger';
import dotenv from 'dotenv';

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
    'masterbundler.config.ts',
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