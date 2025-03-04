import { rollup, RollupOptions, OutputOptions } from 'rollup';
import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import { BundleOptions, BuildResult } from './types';
import { getOutputPath, resolveInput } from './utils/paths';
import { logger } from './utils/logger';
import { pluginManager } from './plugins/manager';
import { createProgress } from './utils/progress';
import path from 'path';

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
  const {
    input,
    format = 'esm',
    minify = true,
    sourcemap = true,
    name,
    external = [],
    globals = {},
    outDir: userOutDir,
    chunkFileNames = '[name]-[hash].js',
    manualChunks,
  } = options;

  const progress = createProgress({
    message: 'Starting bundling process',
    total: 100
  });

  try {
    progress.update({ current: 10, message: 'Setting up plugins' });
    await pluginManager.executeHook('setup', options);

    const resolvedInput = resolveInput(input);
    const outputPath = getOutputPath(resolvedInput, format, userOutDir);
    const outputDir = path.dirname(outputPath);

    progress.update({ current: 20, message: 'Configuring Rollup' });

    const outputOptions: OutputOptions = {
      file: outputPath,
      format,
      name,
      sourcemap,
      globals,
      chunkFileNames,
      manualChunks,
    };

    const rollupOptions: RollupOptions = {
      input: resolvedInput,
      external,
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
            sourceMap: sourcemap,
          },
        }),
        resolve({
          extensions: ['.ts', '.js'],
          preferBuiltins: true,
        }),
        commonjs(),
        minify && terser(),
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
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    progress.fail(`Bundle failed: ${errorMessage}`);
    logger.error(`Bundle failed: ${errorMessage}`);
    throw error;
  }
}