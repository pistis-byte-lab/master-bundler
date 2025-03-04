import { DefaultPluginManager } from '../src/plugins/manager';
import { MinifyPlugin } from '../src/plugins/examples/minify';
import { Plugin, PluginContext } from '../src/plugins/types';

describe('Plugin System', () => {
  let pluginManager: DefaultPluginManager;

  beforeEach(() => {
    pluginManager = new DefaultPluginManager();
  });

  it('should register and execute plugins', async () => {
    const minifyPlugin = new MinifyPlugin();
    pluginManager.addPlugin(minifyPlugin);

    const context: PluginContext = {
      options: { input: 'test.ts' },
      filePath: 'test.ts',
      content: `
        // This is a comment
        export const hello = "world";
        /* Multi-line
           comment */
      `
    };

    const result = await pluginManager.executeHook('transform', context);
    expect(result.content).toBe('export const hello = "world";');
  });

  it('should handle plugin errors gracefully', async () => {
    const errorPlugin = {
      name: 'error-plugin',
      transform: () => {
        throw new Error('Test error');
      }
    };

    pluginManager.addPlugin(errorPlugin);

    const context = {
      options: { input: 'test.ts' },
      filePath: 'test.ts',
      content: 'test'
    };

    await expect(pluginManager.executeHook('transform', context))
      .rejects
      .toThrow('Test error');
  });

  it('should remove plugins correctly', () => {
    const plugin = new MinifyPlugin();
    pluginManager.addPlugin(plugin);
    expect(pluginManager.getPlugins()).toHaveLength(1);

    pluginManager.removePlugin(plugin.name);
    expect(pluginManager.getPlugins()).toHaveLength(0);
  });

  it('should support hot plugin reloading', () => {
    const plugin = new MinifyPlugin();
    const reloadedPlugin = new MinifyPlugin();
    let reloadCount = 0;

    pluginManager.onPluginChange((event, pluginName) => {
      if (event === 'pluginAdded' && pluginName === plugin.name) {
        reloadCount++;
      }
    });

    // Initial plugin registration
    pluginManager.addPlugin(plugin);
    expect(reloadCount).toBe(1);
    expect(pluginManager.getPlugins()).toHaveLength(1);

    // Hot reload the plugin
    pluginManager.reloadPlugin(reloadedPlugin);
    expect(reloadCount).toBe(2);
    expect(pluginManager.getPlugins()).toHaveLength(1);
  });

  it('should execute all transformation hooks in order', async () => {
    const executionOrder: string[] = [];
    const testPlugin: Plugin = {
      name: 'test-plugin',
      beforeTransform(context: PluginContext) {
        executionOrder.push('beforeTransform');
        return context.content;
      },
      transform(context: PluginContext) {
        executionOrder.push('transform');
        return context.content;
      },
      afterTransform(context: PluginContext) {
        executionOrder.push('afterTransform');
        return context.content;
      }
    };

    pluginManager.addPlugin(testPlugin);
    const testContext = { content: 'test', filePath: 'test.ts', options: { input: 'test.ts' } };
    await pluginManager.executeHook('beforeTransform', testContext);
    await pluginManager.executeHook('transform', testContext);
    await pluginManager.executeHook('afterTransform', testContext);

    expect(executionOrder).toEqual(['beforeTransform', 'transform', 'afterTransform']);
  });

  it('should handle plugin configuration', () => {
    const plugin: Plugin = {
      name: 'config-test-plugin',
      defaultConfig: {
        option1: 'default',
        option2: 123
      }
    };

    // Test default config
    pluginManager.addPlugin(plugin);
    let config = pluginManager.getPluginConfig('config-test-plugin');
    expect(config).toEqual({ option1: 'default', option2: 123 });

    // Test custom config
    const customConfig = { option1: 'custom', option3: true };
    pluginManager.setPluginConfig('config-test-plugin', customConfig);
    config = pluginManager.getPluginConfig('config-test-plugin');
    expect(config).toEqual({
      option1: 'custom',
      option2: 123,
      option3: true
    });
  });
});