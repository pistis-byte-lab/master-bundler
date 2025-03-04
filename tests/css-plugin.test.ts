import { CSSPlugin } from '../src/plugins/examples/css';
import { PluginContext } from '../src/plugins/types';

describe('CSS Plugin', () => {
  let cssPlugin: CSSPlugin;

  beforeEach(() => {
    cssPlugin = new CSSPlugin();
    cssPlugin.setup({});
  });

  afterEach(() => {
    cssPlugin.cleanup();
  });

  it('should process CSS files', async () => {
    const context: PluginContext = {
      options: { input: 'test.css' },
      filePath: 'test.css',
      content: `
        .example {
          display: flex;
          user-select: none;
          color: #ffffff;
          background-color: #000000;
        }
      `
    };

    const result = await cssPlugin.transform(context);
    expect(result).toBeDefined();
    expect(result).toContain('display:flex');
    expect(result).toContain('-webkit-user-select:none');
    expect(result).toContain('#fff');
    expect(result).toContain('#000');
    expect(result.length).toBeLessThan(context.content.length); // Should be minified
  });

  it('should compile and process SCSS files', async () => {
    const context: PluginContext = {
      options: { input: 'test.scss' },
      filePath: 'test.scss',
      content: `
        $primary-color: #ffffff;
        $bg-color: #000000;

        .example {
          display: flex;
          user-select: none;
          color: $primary-color;
          background-color: $bg-color;

          &:hover {
            opacity: 0.8;
          }
        }
      `
    };

    const result = await cssPlugin.transform(context);
    expect(result).toBeDefined();
    expect(result).toContain('display:flex');
    expect(result).toContain('-webkit-user-select:none');
    expect(result).toContain('#fff');
    expect(result).toContain('#000');
    expect(result).toContain('opacity:.8');
    expect(result.length).toBeLessThan(context.content.length); // Should be minified
  });

  it('should ignore non-CSS/SCSS files', async () => {
    const context: PluginContext = {
      options: { input: 'test.ts' },
      filePath: 'test.ts',
      content: 'export const test = "test";'
    };

    const result = await cssPlugin.transform(context);
    expect(result).toBe(context.content);
  });

  it('should handle empty files', async () => {
    const context: PluginContext = {
      options: { input: 'empty.css' },
      filePath: 'empty.css',
      content: ''
    };

    const result = await cssPlugin.transform(context);
    expect(result).toBe('');
  });

  it('should handle invalid CSS', async () => {
    const context: PluginContext = {
      options: { input: 'invalid.css' },
      filePath: 'invalid.css',
      content: '.invalid { color: '
    };

    await expect(cssPlugin.transform(context)).rejects.toThrow();
  });
});