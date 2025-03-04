import { Plugin, PluginContext, PluginManager, PluginConfig } from './types';
import { logger } from '../utils/logger';
import { EventEmitter } from 'events';

export class DefaultPluginManager implements PluginManager {
  private plugins: Plugin[] = [];
  private configs: Map<string, PluginConfig> = new Map();
  private eventEmitter: EventEmitter;

  constructor() {
    this.eventEmitter = new EventEmitter();
  }

  addPlugin(plugin: Plugin, config?: PluginConfig): void {
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
    logger.info(`Plugin "${plugin.name}" registered`);
    this.eventEmitter.emit('pluginAdded', plugin.name);

    // Initialize plugin with config
    if (plugin.setup) {
      plugin.setup(undefined as any, mergedConfig);
    }
  }

  removePlugin(pluginName: string): void {
    const index = this.plugins.findIndex(p => p.name === pluginName);
    if (index > -1) {
      const plugin = this.plugins[index];
      if (plugin.cleanup) {
        try {
          plugin.cleanup();
        } catch (error) {
          logger.error(`Error cleaning up plugin "${pluginName}": ${error}`);
        }
      }
      this.plugins.splice(index, 1);
      this.configs.delete(pluginName);
      logger.info(`Plugin "${pluginName}" removed`);
      this.eventEmitter.emit('pluginRemoved', pluginName);
    }
  }

  getPlugins(): Plugin[] {
    return [...this.plugins];
  }

  async executeHook<T>(hookName: keyof Plugin, context: T): Promise<T> {
    let result = context;

    for (const plugin of this.plugins) {
      const hook = plugin[hookName];
      if (typeof hook === 'function') {
        try {
          logger.info(`Executing ${hookName} hook for plugin "${plugin.name}"`);
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
        } catch (error) {
          logger.error(`Error in plugin "${plugin.name}" during ${hookName}: ${error}`);
          throw error;
        }
      }
    }

    return result;
  }

  onPluginChange(callback: (event: 'pluginAdded' | 'pluginRemoved', pluginName: string) => void): void {
    this.eventEmitter.on('pluginAdded', (pluginName) => callback('pluginAdded', pluginName));
    this.eventEmitter.on('pluginRemoved', (pluginName) => callback('pluginRemoved', pluginName));
  }

  reloadPlugin(plugin: Plugin, config?: PluginConfig): void {
    this.addPlugin(plugin, config);
    logger.info(`Plugin "${plugin.name}" reloaded`);
    this.eventEmitter.emit('pluginAdded', plugin.name);
  }

  getPluginConfig(pluginName: string): PluginConfig | undefined {
    return this.configs.get(pluginName);
  }

  setPluginConfig(pluginName: string, config: PluginConfig): void {
    const plugin = this.plugins.find(p => p.name === pluginName);
    if (!plugin) {
      throw new Error(`Plugin "${pluginName}" not found`);
    }
    const mergedConfig = {
      ...(plugin.defaultConfig || {}),
      ...config
    };
    this.configs.set(pluginName, mergedConfig);
    logger.info(`Updated configuration for plugin "${pluginName}"`);
  }
}

export const pluginManager = new DefaultPluginManager();