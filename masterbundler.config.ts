
import { BundleOptions } from './src/types';

/**
 * Master Bundler Configuration
 * 
 * This file configures the behavior of the bundler for your project.
 * Each option is documented with its purpose, default value, and possible options.
 */
const config: BundleOptions = {
  /**
   * Main entry point(s) for your project
   * 
   * This can be:
   * - A single file path string (e.g., 'src/index.ts')
   * - An array of file path strings (e.g., ['src/main.ts', 'src/worker.ts'])
   * - An object of entry names to file paths (e.g., { main: 'src/main.ts', worker: 'src/worker.ts' })
   * 
   * When using an array or object, each entry will generate its own output bundle with the
   * appropriate naming convention based on the entry name or file name.
   * 
   * Default: 'src/index.ts'
   * 
   * Examples:
   * - Single entry: 'src/index.ts'
   * - Multiple entries as array: ['src/main.ts', 'src/worker.ts', 'src/utils.ts']
   * - Multiple entries as object: { app: 'src/app.ts', admin: 'src/admin.ts', shared: 'src/shared.ts' }
   */
  input: 'src/index.ts',
  
  /**
   * Output directory for bundled files
   * 
   * Specifies the directory where all output files will be written.
   * Nested directory structures will be created if they don't exist.
   * 
   * Default: 'dist'
   * 
   * Examples:
   * - 'dist'
   * - 'build/js'
   * - 'public/assets/scripts'
   */
  outDir: 'dist',
  
  /**
   * Output format(s) for the bundle
   * 
   * Specifies which module format(s) to output. This can be:
   * - A single format string
   * - An array of format strings for multiple output formats
   * 
   * When multiple formats are specified, the bundler will generate separate output files
   * for each format with appropriate file extensions:
   * - .mjs for ESM
   * - .cjs for CommonJS
   * - .umd.js for UMD
   * 
   * Available formats:
   * - 'esm': ECMAScript modules using import/export statements (modern browsers, Node.js 14+)
   * - 'cjs': CommonJS modules using require/module.exports (Node.js)
   * - 'umd': Universal Module Definition (works in browsers via <script>, AMD, and CommonJS)
   * - 'iife': Immediately Invoked Function Expression (browser-only, global namespace)
   * - 'system': SystemJS module format (dynamic importing in browsers)
   * 
   * Default: ['esm', 'cjs', 'umd']
   * 
   * Examples:
   * - Single format: 'esm'
   * - Common multi-format: ['esm', 'cjs']
   * - Full compatibility: ['esm', 'cjs', 'umd']
   * - Browser-focused: ['esm', 'umd']
   * 
   * Note: When building libraries intended to be consumed by other packages, providing
   * multiple formats ensures maximum compatibility with different environments.
   */
  format: ['esm', 'cjs', 'umd'],
  
  /**
   * Whether to minify the output code
   * 
   * When true, the bundler will remove whitespace, shorten variable names,
   * and perform other optimizations to reduce file size.
   * 
   * Default: true in production, false in development
   */
  minify: true,
  
  /**
   * Whether to generate source maps
   * 
   * Source maps help with debugging by mapping the bundled code
   * back to the original source files.
   * 
   * Default: true in development, false in production
   */
  sourcemap: true,
  
  /**
   * ECMAScript target version(s)
   * 
   * Specifies which ECMAScript features to transpile.
   * Can be a single target or an array of targets for differential loading.
   * 
   * Common options: 'es2015', 'es2016', 'es2017', 'es2018', 'es2019', 'es2020', 'es2021', 'es2022'
   * 
   * Default: ['es2019']
   * Example for differential loading: ['es2015', 'es2020']
   */
  target: ['es2019'],
  
  /**
   * External modules that should not be bundled
   * 
   * These modules will be marked as external dependencies and
   * not included in the bundle. The consumer of your library
   * will need to provide these dependencies.
   * 
   * Default: []
   */
  external: [
    'react', 
    'react-dom'
  ],
  
  /**
   * Global variable names for external modules (important for UMD format)
   * 
   * Maps module names to global variable names when generating UMD bundles.
   * This is necessary for the bundled code to access external dependencies.
   * 
   * Default: {}
   */
  globals: {
    'react': 'React',
    'react-dom': 'ReactDOM'
  },
  
  /**
   * Bundling strategy to use
   * 
   * Options:
   * - 'default': Standard bundling
   * - 'single': Single bundle output
   * - 'multiple': Multiple chunks based on modules
   * - 'dynamic': Optimized for dynamic imports
   * - 'adaptive': Automatically selects the best strategy
   * - 'differential': Creates different bundles for modern/legacy browsers
   * - 'worker': Optimized for web worker usage
   * - 'preload': Optimizes critical path modules
   * 
   * Default: 'default'
   */
  strategy: 'default',
  
  /**
   * Plugins to be used during bundling
   * 
   * List of plugin names to apply transformations during the bundling process.
   * Built-in plugins include 'css-plugin', 'asset-plugin', and others.
   * 
   * Default: []
   */
  plugins: [
    'css-plugin',
    'asset-plugin'
  ],
  
  /**
   * Configuration options for specific plugins
   * 
   * Each key corresponds to a plugin name, and the value is an object
   * with plugin-specific options.
   * 
   * Default: {}
   */
  pluginOptions: {
    'css-plugin': {
      /**
       * Whether to use CSS modules
       * Default: false
       */
      modules: true,
      
      /**
       * Whether to extract CSS into separate files
       * Default: false
       */
      extract: true
    },
    'asset-plugin': {
      /**
       * File size limit (in bytes) for inlining assets as data URLs
       * Default: 4096
       */
      limit: 8192
    }
  },
  
  /**
   * Environment variables to be replaced during bundling
   * 
   * These values will be statically replaced at build time.
   * Useful for setting different values for different environments.
   * 
   * Default: {}
   */
  env: {
    NODE_ENV: 'production'
  },
  
  /**
   * Environment-specific configurations
   * 
   * Override specific configuration options based on the NODE_ENV.
   * These will be merged with the base configuration when the specified
   * environment is active.
   * 
   * Default: {}
   */
  environments: {
    development: {
      minify: false,
      sourcemap: true,
      env: {
        NODE_ENV: 'development'
      }
    },
    production: {
      minify: true,
      sourcemap: false
    }
  }
};

export default config;
