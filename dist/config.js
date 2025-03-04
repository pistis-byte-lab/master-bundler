"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = exports.Config = void 0;
exports.createDefaultConfig = createDefaultConfig;
exports.resolveConfig = resolveConfig;
exports.loadConfig = loadConfig;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const logger_1 = require("./utils/logger");
const DEFAULT_CONFIG = {
    format: 'esm',
    minify: true,
    sourcemap: true,
    target: ['es2019'],
    external: [],
    globals: {},
};
class Config {
    constructor() {
        this.config = { ...DEFAULT_CONFIG };
    }
    static getInstance() {
        if (!Config.instance) {
            Config.instance = new Config();
        }
        return Config.instance;
    }
    loadConfigFile(configPath) {
        const configFile = configPath || path_1.default.join(process.cwd(), 'ts-bundler.config.js');
        try {
            if (fs_1.default.existsSync(configFile)) {
                const userConfig = require(configFile);
                this.config = {
                    ...DEFAULT_CONFIG,
                    ...userConfig,
                };
                logger_1.logger.info('Configuration loaded successfully');
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger_1.logger.warning(`Failed to load config file: ${errorMessage}`);
            logger_1.logger.info('Using default configuration');
        }
    }
    mergeConfig(options) {
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
    getConfig() {
        return { ...this.config };
    }
    validateConfig(config) {
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
    setConfig(newConfig) {
        this.config = {
            ...this.config,
            ...newConfig,
        };
    }
    reset() {
        this.config = { ...DEFAULT_CONFIG };
    }
}
exports.Config = Config;
exports.config = Config.getInstance();
function createDefaultConfig(input) {
    return {
        input,
        ...DEFAULT_CONFIG,
    };
}
function resolveConfig(options) {
    const configInstance = Config.getInstance();
    const mergedConfig = configInstance.mergeConfig(options);
    configInstance.validateConfig(mergedConfig);
    return mergedConfig;
}
const dotenv_1 = __importDefault(require("dotenv"));
function loadConfig(configPath) {
    const defaultConfigPaths = [
        'bundler.config.js',
        'bundler.config.json',
        'bundler.config.ts'
    ];
    let resolvedConfigPath = configPath;
    // If no config path provided, try to find one
    if (!resolvedConfigPath) {
        for (const p of defaultConfigPaths) {
            if (fs_1.default.existsSync(p)) {
                resolvedConfigPath = p;
                break;
            }
        }
    }
    if (!resolvedConfigPath || !fs_1.default.existsSync(resolvedConfigPath)) {
        logger_1.logger.warn('No configuration file found, using defaults');
        return {};
    }
    try {
        let config;
        if (resolvedConfigPath.endsWith('.js')) {
            config = require(path_1.default.resolve(resolvedConfigPath));
        }
        else if (resolvedConfigPath.endsWith('.json')) {
            const fileContent = fs_1.default.readFileSync(resolvedConfigPath, 'utf8');
            config = JSON.parse(fileContent);
        }
        else if (resolvedConfigPath.endsWith('.ts')) {
            // For TS configs, we'll need to use ts-node to require it
            require('ts-node').register({
                transpileOnly: true,
                compilerOptions: { module: 'commonjs' }
            });
            config = require(path_1.default.resolve(resolvedConfigPath));
        }
        else {
            throw new Error(`Unsupported config file format: ${resolvedConfigPath}`);
        }
        // Load environment variables
        loadEnvironmentVariables(config);
        // Apply environment-specific configuration
        applyEnvironmentConfig(config);
        validateConfig(config);
        return config;
    }
    catch (error) {
        logger_1.logger.error(`Failed to load config from ${resolvedConfigPath}:`, error);
        throw new Error(`Failed to load config: ${error.message}`);
    }
}
function loadEnvironmentVariables(config) {
    // Load from .env file
    const envPath = path_1.default.resolve(process.cwd(), '.env');
    if (fs_1.default.existsSync(envPath)) {
        const envResult = dotenv_1.default.config({ path: envPath });
        if (envResult.error) {
            logger_1.logger.warn(`Error loading .env file: ${envResult.error.message}`);
        }
        else {
            logger_1.logger.debug('Loaded environment variables from .env file');
        }
    }
    // Override with environment-specific .env file
    const nodeEnv = process.env.NODE_ENV || 'development';
    const envSpecificPath = path_1.default.resolve(process.cwd(), `.env.${nodeEnv}`);
    if (fs_1.default.existsSync(envSpecificPath)) {
        const envResult = dotenv_1.default.config({ path: envSpecificPath });
        if (envResult.error) {
            logger_1.logger.warn(`Error loading .env.${nodeEnv} file: ${envResult.error.message}`);
        }
        else {
            logger_1.logger.debug(`Loaded environment variables from .env.${nodeEnv} file`);
        }
    }
    // Add custom env variables from config
    if (config.env) {
        for (const [key, value] of Object.entries(config.env)) {
            process.env[key] = value;
        }
    }
}
function applyEnvironmentConfig(config) {
    const nodeEnv = process.env.NODE_ENV || 'development';
    // Apply environment-specific configuration if available
    if (config.environments && config.environments[nodeEnv]) {
        const envConfig = config.environments[nodeEnv];
        logger_1.logger.info(`Applying ${nodeEnv} environment configuration`);
        // Merge the environment-specific config with the base config
        Object.assign(config, envConfig);
    }
}
function validateConfig(config) {
    if (!config.input && !config.input) {
        logger_1.logger.warn('No input file specified in config');
    }
    if (config.format && !['esm', 'umd', 'cjs'].includes(config.format)) {
        logger_1.logger.warn(`Invalid format: ${config.format}. Using default 'esm' format.`);
        config.format = 'esm';
    }
    if (config.minify !== undefined && typeof config.minify !== 'boolean') {
        logger_1.logger.warn(`Invalid minify option: ${config.minify}. Using default 'false'.`);
        config.minify = false;
    }
    // More validations can be added here
}
//# sourceMappingURL=config.js.map