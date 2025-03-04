import { BundleOptions } from '../types';

export interface PluginConfig {
  [key: string]: any;
}

export interface PluginContext {
  options: BundleOptions;
  filePath: string;
  content: string;
  config?: PluginConfig;
}

export interface Plugin {
  name: string;
  defaultConfig?: PluginConfig;
  setup?: (options: BundleOptions, config?: PluginConfig) => void | Promise<void>;
  beforeTransform?: (context: PluginContext) => string | Promise<string>;
  transform?: (context: PluginContext) => string | Promise<string>;
  afterTransform?: (context: PluginContext) => string | Promise<string>;
  cleanup?: () => void | Promise<void>;
}

export interface PluginManager {
  addPlugin: (plugin: Plugin, config?: PluginConfig) => void;
  removePlugin: (pluginName: string) => void;
  getPlugins: () => Plugin[];
  executeHook: <T>(hookName: keyof Plugin, context: T) => Promise<T>;
  onPluginChange?: (callback: (event: 'pluginAdded' | 'pluginRemoved', pluginName: string) => void) => void;
  reloadPlugin?: (plugin: Plugin, config?: PluginConfig) => void;
  getPluginConfig?: (pluginName: string) => PluginConfig | undefined;
  setPluginConfig?: (pluginName: string, config: PluginConfig) => void;
}