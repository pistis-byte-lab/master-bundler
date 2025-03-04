import { Plugin, PluginManager, PluginConfig } from './types';
export declare class DefaultPluginManager implements PluginManager {
    private plugins;
    private configs;
    private eventEmitter;
    constructor();
    addPlugin(plugin: Plugin, config?: PluginConfig): void;
    removePlugin(pluginName: string): void;
    getPlugins(): Plugin[];
    executeHook<T>(hookName: keyof Plugin, context: T): Promise<T>;
    onPluginChange(callback: (event: 'pluginAdded' | 'pluginRemoved', pluginName: string) => void): void;
    reloadPlugin(plugin: Plugin, config?: PluginConfig): void;
    getPluginConfig(pluginName: string): PluginConfig | undefined;
    setPluginConfig(pluginName: string, config: PluginConfig): void;
}
export declare const pluginManager: DefaultPluginManager;
//# sourceMappingURL=manager.d.ts.map