# Master Bundler

> 🚧 **WORK IN PROGRESS** 🚧
> 
> Este projeto está em desenvolvimento ativo e não está pronto para uso em produção. Funcionalidades podem mudar ou estar incompletas.

A modern TypeScript bundler with support for multiple module formats, tree shaking, and optimizations.

## Features

- TypeScript support with strict type checking
- Multiple output formats (ESM, UMD, CJS)
- Tree shaking and code optimization
- Source maps generation
- Type definitions generation
- Watch mode for development
- Clear CLI interface
- Plugin system for custom transformations
- Asset optimization and handling

## Installation

```bash
npm install -g ts-bundler
```

## Plugin System

The bundler supports plugins for custom transformations. Plugins can hook into different stages of the bundling process:

### Plugin Lifecycle Hooks

1. `setup`: Called when bundling starts. Use this to initialize your plugin with options.
   ```typescript
   setup(options: BundleOptions, config?: PluginConfig): void | Promise<void>
   ```

2. `beforeTransform`: Called before any code transformation. Use this for initial code analysis or preparation.
   ```typescript
   beforeTransform(context: PluginContext): string | Promise<string>
   ```

3. `transform`: Called during the main code transformation phase.
   ```typescript
   transform(context: PluginContext): string | Promise<string>
   ```

4. `afterTransform`: Called after all transformations. Use this for final code modifications or validation.
   ```typescript
   afterTransform(context: PluginContext): string | Promise<string>
   ```

5. `cleanup`: Called when bundling completes. Use this to clean up resources.
   ```typescript
   cleanup(): void | Promise<void>
   ```

### Creating a Plugin

```typescript
import { Plugin, PluginContext } from 'ts-bundler/plugins';

export class MyPlugin implements Plugin {
  name = 'my-plugin';

  // Default configuration
  defaultConfig = {
    option1: 'default-value',
    option2: true
  };

  setup(options: BundleOptions, config?: PluginConfig): void {
    // Initialize plugin with options and config
  }

  async beforeTransform(context: PluginContext): Promise<string> {
    // Pre-process code
    // Access plugin config via context.config
    return context.content;
  }

  async transform(context: PluginContext): Promise<string> {
    // Transform code
    return modifiedContent;
  }

  async afterTransform(context: PluginContext): Promise<string> {
    // Post-process code
    return context.content;
  }

  cleanup(): void {
    // Clean up resources
  }
}
```

### Using Plugins

```typescript
import { pluginManager } from 'ts-bundler/plugins';
import { MyPlugin } from './my-plugin';

// Register plugin with custom config
pluginManager.addPlugin(new MyPlugin(), {
  option1: 'custom-value',
  option2: false
});

// Hot reload plugin with new config
pluginManager.reloadPlugin(new MyPlugin(), {
  option1: 'updated-value'
});

// Update plugin config
pluginManager.setPluginConfig('my-plugin', {
  option2: true
});
```

### Plugin Context

The `PluginContext` object provides access to:

- `options`: The bundler options
- `filePath`: The current file being processed
- `content`: The file content being transformed
- `config`: Plugin-specific configuration

### Built-in Plugins

1. Minification Plugin
   - Minifies code using terser
   - Removes comments and whitespace
   - Optimizes output size

2. CSS/SCSS Plugin
   - Processes CSS and SCSS files
   - Adds vendor prefixes
   - Minifies CSS output
   - Generates source maps

3. Asset Plugin
   - Handles static assets (images, fonts, etc.)
   - Optimizes images automatically
     - Resizes large images (configurable max dimensions)
     - Compresses images while maintaining quality
     - Supports PNG and JPEG formats
   - Processes font files
     - Supports popular font formats (WOFF, WOFF2, TTF, EOT)
     - Maintains directory structure
   - Configuration options:
     ```typescript
     {
       patterns: ['**/*.{png,jpg,jpeg,gif,svg,woff,woff2,ttf,eot}'],
       outputDir: 'dist/assets',
       flatten: false,
       optimize: {
         images: true,
         quality: 80,
         maxWidth: 1920,
         maxHeight: 1080
       }
     }
     ```

## Usage

Refer to the documentation for detailed usage instructions and examples.