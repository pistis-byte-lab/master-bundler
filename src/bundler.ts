import { rollup, RollupOptions, OutputOptions } from 'rollup';
import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import { BundleOptions, BuildResult } from './types';
import { getOutputPath, resolveInput } from './utils/paths';
import { logger } from './utils/logger';
import { PluginManager } from './plugins/manager';
import { cacheManager } from './cache';
import { createProgress } from './utils/progress';
import path from 'path';
import { applyBundlingStrategy, BundlingStrategyType } from './strategies/bundling-strategies';

async function transformCode(code: string, filePath: string, options: BundleOptions): Promise<string> {
  const progress = createProgress({
    message: `Transforming ${path.basename(filePath)}`,
    total: pluginManager.getPlugins().length + 1
  });

  const context = {
    options,
    filePath,
    content: code
  };

  let result = context;
  let currentStep = 0;

  try {
    progress.update({ current: ++currentStep, message: 'Running pre-transform hooks' });
    result = await pluginManager.executeHook('beforeTransform', result);

    progress.update({ current: ++currentStep, message: 'Applying transformations' });
    result = await pluginManager.executeHook('transform', result);

    progress.update({ current: ++currentStep, message: 'Running post-transform hooks' });
    result = await pluginManager.executeHook('afterTransform', result);

    progress.complete('Transformation completed');
    return result.content;
  } catch (error) {
    progress.fail('Transformation failed');
    throw error;
  }
}

export async function bundle(options: BundleOptions): Promise<BuildResult> {
  logger.info(`Bundling ${options.input} using format ${options.format || 'esm'}`);

  // Aplicar estratégia de bundling se especificada
  if (options.strategy) {
    logger.info(`Applying bundling strategy: ${options.strategy}`);
    options = await applyBundlingStrategy(options, options.strategy);
  }

  // Initialize plugins
  const pluginManager = new PluginManager({
    enableHotReload: options.watchMode === true,
    configPath: options.pluginConfigPath
  });

  try {
    // Initialize plugin manager
    await pluginManager.initialize();

    // Register built-in plugins if needed
    if (options.plugins && options.plugins.length > 0) {
      for (const pluginName of options.plugins) {
        try {
          // Try to load the plugin
          const pluginModule = await import(`./plugins/${pluginName}`);
          const plugin = pluginModule.default || pluginModule;

          // Check if it's a valid plugin
          if (typeof plugin === 'function') {
            pluginManager.registerPlugin(new plugin(options.pluginOptions?.[pluginName]));
          } else {
            pluginManager.registerPlugin(plugin);
          }
        } catch (error) {
          logger.warn(`Failed to load plugin ${pluginName}: ${error.message}`);
        }
      }
    }

    // Create plugin context
    const pluginContext = {
      options,
      warn: (message: string) => logger.warn(message),
      error: (message: string | Error) => {
        const errorMessage = message instanceof Error ? message.message : message;
        logger.error(errorMessage);
      },
      emitFile: (fileName: string, source: string) => {
        // Implementation to emit a file
      },
      emitAsset: (fileName: string, source: Buffer | string) => {
        // Implementation to emit an asset
        return fileName;
      },
      resolve: async (importee: string, importer: string) => {
        // Implementation to resolve imports
        return null;
      },
      addWatchFile: (id: string) => {
        // Implementation to add a watch file
      },
      getCwd: () => process.cwd(),
      getModuleInfo: (id: string) => {
        // Implementation to get module info
        return null;
      }
    };

    // Call buildStart hooks on all plugins
    await pluginManager.runHook('buildStart', pluginContext, options);

    const resolvedInput = resolveInput(options.input);
    const outputPath = getOutputPath(resolvedInput, options.format, options.outDir);
    const outputDir = path.dirname(outputPath);

    progress.update({ current: 20, message: 'Configuring Rollup' });

    const outputOptions: OutputOptions = {
      file: outputPath,
      format: options.format,
      name: options.name,
      sourcemap: options.sourcemap,
      globals: options.globals,
      chunkFileNames: options.chunkFileNames,
      manualChunks: options.manualChunks,
    };

    const rollupOptions: RollupOptions = {
      input: resolvedInput,
      external: options.external,
      output: outputOptions,
      plugins: [
        {
          name: 'ts-bundler-plugins',
          async transform(code: string, id: string) {
            if (id.endsWith('.ts') || id.endsWith('.tsx')) {
              return await transformCode(code, id, options);
            }
            return null;
          }
        },
        typescript({
          tsconfig: 'tsconfig.json',
          declaration: true,
          outDir: outputDir,
          moduleResolution: 'node',
          compilerOptions: {
            module: 'esnext',
            target: 'es2019',
            sourceMap: options.sourcemap,
          },
        }),
        resolve({
          extensions: ['.ts', '.js'],
          preferBuiltins: true,
        }),
        commonjs(),
        options.minify && terser(),
      ].filter(Boolean),
    };

    progress.update({ current: 40, message: 'Creating bundle' });
    const bundle = await rollup(rollupOptions);

    progress.update({ current: 60, message: `Writing output to: ${outputPath}` });
    logger.info(`Writing output to: ${outputPath}`);

    const output = await bundle.write(outputOptions);

    progress.update({ current: 80, message: 'Cleaning up' });
    await bundle.close();

    progress.update({ current: 90, message: 'Running plugin cleanup' });
    await pluginManager.executeHook('cleanup', null);

    progress.complete('Bundle completed successfully');

    return {
      code: output.output[0].code,
      map: output.output[0].map?.toString(),
      declarations: output.output[0].fileName,
    };
  } catch (error) {
    // Call buildEnd hooks with error
    if (pluginManager) {
      await pluginManager.runHook('buildEnd', pluginContext, error);
      pluginManager.dispose();
    }

    throw error;
  }
}

export interface BundleOptions {
  input: string;
  outDir?: string;
  minify?: boolean;
  sourcemap?: boolean;
  format?: 'esm' | 'cjs' | 'umd';
  target?: string;
  name?: string;
  external?: string[];
  plugins?: Plugin[];
  watch?: boolean;
  watchOptions?: Record<string, any>;
  dryRun?: boolean;
  collectModuleInfo?: boolean;
  strategy?: BundlingStrategyType;
  // Opções específicas para estratégias
  preserveModules?: boolean;
  inlineDynamicImports?: boolean;
  manualChunks?: Record<string, string[]> | ((id: string) => string | undefined);
  preloadModules?: string[];
  workerModules?: string[];
  modern?: boolean;
  suffix?: string;
}

//Added this to satisfy the compiler.  The actual definition of Plugin is likely elsewhere in the project.
interface Plugin { }