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
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';
import { formatError } from '../utils/error-handler';
import { Plugin, PluginContext, PluginHooks } from './types';

export interface PluginManagerOptions {
  pluginsDir?: string;
  enableHotReload?: boolean;
  configPath?: string;
}

export class PluginManager {
  private plugins: Plugin[] = [];
  private pluginsDir: string;
  private enableHotReload: boolean;
  private configPath?: string;
  private watchers: Map<string, fs.FSWatcher> = new Map();
  private pluginInstances: Map<string, Plugin> = new Map();
  private pluginConfigs: Map<string, any> = new Map();

  constructor(options: PluginManagerOptions = {}) {
    this.pluginsDir = options.pluginsDir || path.resolve(process.cwd(), 'src/plugins');
    this.enableHotReload = options.enableHotReload || false;
    this.configPath = options.configPath;
  }

  async initialize(): Promise<void> {
    try {
      logger.info('Initializing plugin manager...');

      // Load plugin configurations
      await this.loadPluginConfigurations();

      // Load and register all plugins
      await this.loadPlugins();

      // Set up hot reloading if enabled
      if (this.enableHotReload) {
        this.setupHotReloading();
      }

      logger.success(`Initialized ${this.plugins.length} plugins`);
    } catch (error: unknown) {
      logger.error(`Failed to initialize plugin manager: ${formatError(error)}`);
      throw error;
    }
  }

  private async loadPluginConfigurations(): Promise<void> {
    if (!this.configPath) return;

    try {
      if (fs.existsSync(this.configPath)) {
        const configContent = fs.readFileSync(this.configPath, 'utf-8');
        const config = JSON.parse(configContent);
        
        if (config.plugins) {
          for (const [pluginName, pluginConfig] of Object.entries(config.plugins)) {
            this.pluginConfigs.set(pluginName, pluginConfig);
          }
        }
        
        logger.debug(`Loaded configurations for ${this.pluginConfigs.size} plugins`);
      }
    } catch (error: unknown) {
      logger.warn(`Error loading plugin configurations: ${formatError(error)}`);
    }
  }

  private async loadPlugins(): Promise<void> {
    try {
      // Check if plugins directory exists
      if (!fs.existsSync(this.pluginsDir)) {
        logger.warn(`Plugins directory not found: ${this.pluginsDir}`);
        return;
      }

      // Find all potential plugin files
      const pluginFiles = this.findPluginFiles(this.pluginsDir);
      logger.debug(`Found ${pluginFiles.length} potential plugin files`);

      // Load each plugin
      for (const file of pluginFiles) {
        await this.loadPlugin(file);
      }
    } catch (error: unknown) {
      logger.error(`Failed to load plugins: ${formatError(error)}`);
      throw error;
    }
  }

  private findPluginFiles(dir: string): string[] {
    const results: string[] = [];
    
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          // Skip node_modules and hidden directories
          if (entry.name !== 'node_modules' && !entry.name.startsWith('.')) {
            results.push(...this.findPluginFiles(fullPath));
          }
        } else if (
          entry.isFile() && 
          (entry.name.endsWith('.js') || entry.name.endsWith('.ts')) &&
          !entry.name.endsWith('.d.ts') &&
          !entry.name.endsWith('.test.js') &&
          !entry.name.endsWith('.test.ts') &&
          !entry.name.includes('example') &&
          entry.name !== 'types.ts' &&
          entry.name !== 'manager.ts' &&
          entry.name !== 'index.ts'
        ) {
          results.push(fullPath);
        }
      }
    } catch (error: unknown) {
      logger.debug(`Error finding plugin files: ${formatError(error)}`);
    }
    
    return results;
  }

  private async loadPlugin(filePath: string): Promise<void> {
    try {
      // Clear Node's module cache to ensure fresh loading
      const modulePath = path.resolve(filePath);
      delete require.cache[require.resolve(modulePath)];

      // Import the plugin
      const imported = await import(modulePath);
      const pluginModule = imported.default || imported;

      // Check if this is a valid plugin
      if (!this.isValidPlugin(pluginModule)) {
        logger.debug(`Skipping invalid plugin: ${filePath}`);
        return;
      }

      // Create plugin instance
      const plugin = typeof pluginModule === 'function' 
        ? new pluginModule() 
        : pluginModule;
      
      // Set plugin name if not provided
      if (!plugin.name) {
        plugin.name = path.basename(filePath, path.extname(filePath));
      }

      // Apply plugin configuration if available
      if (this.pluginConfigs.has(plugin.name)) {
        plugin.config = this.pluginConfigs.get(plugin.name);
      }

      // Store the plugin
      this.plugins.push(plugin);
      this.pluginInstances.set(filePath, plugin);
      
      logger.info(`Loaded plugin: ${plugin.name}`);
    } catch (error: unknown) {
      logger.warn(`Failed to load plugin from ${filePath}: ${formatError(error)}`);
    }
  }

  private isValidPlugin(plugin: any): boolean {
    // Check if it's a class or an object
    if (typeof plugin !== 'function' && typeof plugin !== 'object') {
      return false;
    }

    // For class constructors
    if (typeof plugin === 'function') {
      try {
        const instance = new plugin();
        return this.hasRequiredPluginProperties(instance);
      } catch {
        return false;
      }
    }

    // For objects
    return this.hasRequiredPluginProperties(plugin);
  }

  private hasRequiredPluginProperties(plugin: any): boolean {
    // Check if it has at least one hook method
    return typeof plugin === 'object' && 
      (
        typeof plugin.transform === 'function' ||
        typeof plugin.load === 'function' ||
        typeof plugin.resolve === 'function' ||
        typeof plugin.buildStart === 'function' ||
        typeof plugin.buildEnd === 'function'
      );
  }

  private setupHotReloading(): void {
    try {
      // Watch plugins directory for changes
      const watcher = fs.watch(this.pluginsDir, { recursive: true }, async (eventType, filename) => {
        if (!filename) return;

        // Only handle changes to .js and .ts files
        if (!filename.endsWith('.js') && !filename.endsWith('.ts')) return;
        
        // Skip test and definition files
        if (filename.endsWith('.d.ts') || 
            filename.endsWith('.test.js') || 
            filename.endsWith('.test.ts')) {
          return;
        }

        const fullPath = path.join(this.pluginsDir, filename);
        logger.info(`Plugin file changed: ${filename}`);

        // Debounce to handle multiple events for the same file
        setTimeout(async () => {
          try {
            // Check if this is an existing plugin
            const existingPlugin = this.pluginInstances.get(fullPath);
            
            if (existingPlugin) {
              // Remove the existing plugin
              this.plugins = this.plugins.filter(p => p !== existingPlugin);
              this.pluginInstances.delete(fullPath);
              logger.debug(`Removed previous version of plugin: ${existingPlugin.name}`);
            }

            // Reload the plugin
            await this.loadPlugin(fullPath);
            logger.success(`Hot reloaded plugin: ${filename}`);
          } catch (error: unknown) {
            logger.error(`Failed to hot reload plugin ${filename}: ${formatError(error)}`);
          }
        }, 100);
      });

      this.watchers.set('plugins', watcher);
      logger.info('Hot reloading enabled for plugins');

      // Also watch plugin config file if specified
      if (this.configPath && fs.existsSync(this.configPath)) {
        const configWatcher = fs.watch(this.configPath, async () => {
          logger.info('Plugin configuration file changed, reloading...');
          
          // Reload configurations
          await this.loadPluginConfigurations();
          
          // Update existing plugin configurations
          for (const plugin of this.plugins) {
            if (plugin.name && this.pluginConfigs.has(plugin.name)) {
              plugin.config = this.pluginConfigs.get(plugin.name);
              logger.debug(`Updated configuration for plugin: ${plugin.name}`);
            }
          }
        });
        
        this.watchers.set('config', configWatcher);
      }
    } catch (error: unknown) {
      logger.warn(`Failed to set up hot reloading: ${formatError(error)}`);
      this.enableHotReload = false;
    }
  }

  /**
   * Get all registered plugins
   */
  getPlugins(): Plugin[] {
    return [...this.plugins];
  }

  /**
   * Register a plugin programmatically
   */
  registerPlugin(plugin: Plugin): void {
    if (!plugin.name) {
      plugin.name = `plugin-${this.plugins.length + 1}`;
    }
    
    this.plugins.push(plugin);
    logger.info(`Registered plugin: ${plugin.name}`);
  }

  /**
   * Unregister a plugin by name
   */
  unregisterPlugin(name: string): boolean {
    const initialLength = this.plugins.length;
    this.plugins = this.plugins.filter(p => p.name !== name);
    
    const removed = initialLength > this.plugins.length;
    if (removed) {
      logger.info(`Unregistered plugin: ${name}`);
    }
    
    return removed;
  }

  /**
   * Run hook for all plugins and collect results
   */
  async runHook<T extends keyof PluginHooks>(
    hook: T, 
    context: PluginContext,
    ...args: Parameters<PluginHooks[T]>
  ): Promise<ReturnType<PluginHooks[T]>[]> {
    const results: any[] = [];

    for (const plugin of this.plugins) {
      if (typeof plugin[hook] === 'function') {
        try {
          // Create a plugin-specific context with plugin name
          const pluginContext = {
            ...context,
            plugin: plugin.name || 'anonymous'
          };

          // @ts-ignore - dynamic method call
          const result = await plugin[hook].apply(plugin, [pluginContext, ...args]);
          if (result !== undefined) {
            results.push(result);
          }
        } catch (error: unknown) {
          const pluginName = plugin.name || 'anonymous';
          logger.error(`Error in plugin ${pluginName} (${hook} hook): ${formatError(error)}`);
        }
      }
    }

    return results;
  }

  /**
   * Clean up resources used by the plugin manager
   */
  dispose(): void {
    // Close all file watchers
    for (const [key, watcher] of this.watchers.entries()) {
      watcher.close();
      this.watchers.delete(key);
    }
    
    logger.debug('Plugin manager disposed');
  }
}
