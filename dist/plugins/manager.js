"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pluginManager = exports.DefaultPluginManager = void 0;
const logger_1 = require("../utils/logger");
const events_1 = require("events");
class DefaultPluginManager {
    constructor() {
        this.plugins = [];
        this.configs = new Map();
        this.eventEmitter = new events_1.EventEmitter();
    }
    addPlugin(plugin, config) {
        if (!plugin.name) {
            throw new Error('Plugin must have a name');
        }
        if (this.plugins.some(p => p.name === plugin.name)) {
            // If plugin exists, remove it first (hot reload)
            this.removePlugin(plugin.name);
        }
        // Merge default config with provided config
        const mergedConfig = {
            ...(plugin.defaultConfig || {}),
            ...(config || {})
        };
        this.configs.set(plugin.name, mergedConfig);
        this.plugins.push(plugin);
        logger_1.logger.info(`Plugin "${plugin.name}" registered`);
        this.eventEmitter.emit('pluginAdded', plugin.name);
        // Initialize plugin with config
        if (plugin.setup) {
            plugin.setup(undefined, mergedConfig);
        }
    }
    removePlugin(pluginName) {
        const index = this.plugins.findIndex(p => p.name === pluginName);
        if (index > -1) {
            const plugin = this.plugins[index];
            if (plugin.cleanup) {
                try {
                    plugin.cleanup();
                }
                catch (error) {
                    logger_1.logger.error(`Error cleaning up plugin "${pluginName}": ${error}`);
                }
            }
            this.plugins.splice(index, 1);
            this.configs.delete(pluginName);
            logger_1.logger.info(`Plugin "${pluginName}" removed`);
            this.eventEmitter.emit('pluginRemoved', pluginName);
        }
    }
    getPlugins() {
        return [...this.plugins];
    }
    async executeHook(hookName, context) {
        let result = context;
        for (const plugin of this.plugins) {
            const hook = plugin[hookName];
            if (typeof hook === 'function') {
                try {
                    logger_1.logger.info(`Executing ${hookName} hook for plugin "${plugin.name}"`);
                    // Bind the plugin instance to the hook function and add config to context
                    const boundHook = hook.bind(plugin);
                    const pluginContext = {
                        ...context,
                        config: this.configs.get(plugin.name)
                    };
                    const hookResult = await boundHook(pluginContext);
                    if (hookResult !== undefined) {
                        result = hookResult;
                    }
                }
                catch (error) {
                    logger_1.logger.error(`Error in plugin "${plugin.name}" during ${hookName}: ${error}`);
                    throw error;
                }
            }
        }
        return result;
    }
    onPluginChange(callback) {
        this.eventEmitter.on('pluginAdded', (pluginName) => callback('pluginAdded', pluginName));
        this.eventEmitter.on('pluginRemoved', (pluginName) => callback('pluginRemoved', pluginName));
    }
    reloadPlugin(plugin, config) {
        this.addPlugin(plugin, config);
        logger_1.logger.info(`Plugin "${plugin.name}" reloaded`);
        this.eventEmitter.emit('pluginAdded', plugin.name);
    }
    getPluginConfig(pluginName) {
        return this.configs.get(pluginName);
    }
    setPluginConfig(pluginName, config) {
        const plugin = this.plugins.find(p => p.name === pluginName);
        if (!plugin) {
            throw new Error(`Plugin "${pluginName}" not found`);
        }
        const mergedConfig = {
            ...(plugin.defaultConfig || {}),
            ...config
        };
        this.configs.set(pluginName, mergedConfig);
        logger_1.logger.info(`Updated configuration for plugin "${pluginName}"`);
    }
}
exports.DefaultPluginManager = DefaultPluginManager;
exports.pluginManager = new DefaultPluginManager();
//# sourceMappingURL=manager.js.map