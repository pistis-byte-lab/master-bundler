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
import { BundleOptions } from '../types';

export interface PluginContext {
  plugin: string;
  options: BundleOptions;
  warn: (message: string) => void;
  error: (message: string | Error) => void;
  emitFile: (fileName: string, source: string) => void;
  emitAsset: (fileName: string, source: Buffer | string) => string;
  resolve: (importee: string, importer: string) => Promise<string | null>;
  addWatchFile: (id: string) => void;
  getCwd: () => string;
  getModuleInfo: (id: string) => any;
  [key: string]: any;
}

export interface TransformResult {
  code: string;
  map?: any;
  dependencies?: string[];
  assets?: Array<{ name: string, source: string | Buffer }>;
  ast?: any;
  meta?: Record<string, any>;
}

export interface ResolveIdResult {
  id: string;
  external?: boolean;
  moduleSideEffects?: boolean | 'no-treeshake';
  syntheticNamedExports?: boolean;
  meta?: Record<string, any>;
}

export interface PluginHooks {
  /**
   * Called at the start of a build
   */
  buildStart?: (ctx: PluginContext, options: BundleOptions) => Promise<void> | void;
  
  /**
   * Called at the end of a build
   */
  buildEnd?: (ctx: PluginContext, error?: Error) => Promise<void> | void;
  
  /**
   * Called when resolving imports
   */
  resolveId?: (
    ctx: PluginContext, 
    source: string, 
    importer: string
  ) => Promise<string | ResolveIdResult | null> | string | ResolveIdResult | null;
  
  /**
   * Called when loading a module
   */
  load?: (
    ctx: PluginContext, 
    id: string
  ) => Promise<string | { code: string; map?: any } | null> | string | { code: string; map?: any } | null;
  
  /**
   * Called to transform module content
   */
  transform?: (
    ctx: PluginContext, 
    code: string, 
    id: string
  ) => Promise<TransformResult | string | null> | TransformResult | string | null;
  
  /**
   * Called when a module is about to be bundled
   */
  moduleParsed?: (ctx: PluginContext, moduleInfo: any) => Promise<void> | void;
  
  /**
   * Called before a chunk is generated
   */
  renderChunk?: (
    ctx: PluginContext, 
    code: string, 
    chunk: any, 
    outputOptions: any
  ) => Promise<{ code: string; map?: any } | null> | { code: string; map?: any } | null;
  
  /**
   * Called after all chunks have been generated
   */
  generateBundle?: (
    ctx: PluginContext, 
    outputOptions: any, 
    bundle: any
  ) => Promise<void> | void;
  
  /**
   * Called after the bundle has been written to disk
   */
  writeBundle?: (
    ctx: PluginContext, 
    outputOptions: any, 
    bundle: any
  ) => Promise<void> | void;
  
  /**
   * Called to configure the plugin
   */
  configure?: (
    ctx: PluginContext, 
    config: any
  ) => Promise<void> | void;
}

export interface Plugin extends Partial<PluginHooks> {
  name?: string;
  config?: any;
}
