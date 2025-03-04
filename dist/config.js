"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = exports.Config = void 0;
exports.createDefaultConfig = createDefaultConfig;
exports.resolveConfig = resolveConfig;
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
//# sourceMappingURL=config.js.map