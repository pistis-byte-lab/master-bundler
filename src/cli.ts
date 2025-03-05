#!/usr/bin/env node
import { Command } from 'commander';
const program = new Command();
import { bundle } from './bundler';
import { Watcher } from './watcher';
import { logger } from './utils/logger';
import fs from 'fs';
import path from 'path';
import { formatError } from './utils/error-handler';
import { analyzeDependencies } from './commands/analyze-deps';
import { analyze } from './analyze-cli';
import { registerMarketplaceCommands } from './commands/marketplace';
import { registerBundlingStrategyCommands } from './commands/bundling-strategy';

interface CliFlags {
  watch?: boolean;
  output?: string;
  format?: 'esm' | 'cjs' | 'umd';
  sourcemap?: boolean;
  minify?: boolean;
  config?: string;
  name?: string;
  help?: boolean;
  version?: boolean;
  target?: string | string[];
  liveReload?: boolean;
  progress?: boolean;
  outDir?: string;
  watchDir?: string;
  chunkFileNames?: string;
}

program
  .name('ts-bundler')
  .description('TypeScript bundler with multiple format support')
  .version('1.0.0');

program
  .argument('<input>', 'Input file path')
  .option('-w, --watch', 'Watch mode')
  .option('-f, --format <format>', 'Output format (esm,umd,cjs)', 'esm')
  .option('-m, --minify', 'Minify output', true)
  .option('-s, --sourcemap', 'Generate source maps', true)
  .option('--out-dir <dir>', 'Output directory')
  .option('--watch-dir <dir>', 'Directory to watch in watch mode (defaults to input file directory)')
  .option('--no-progress', 'Disable progress indicators')
  .option('--chunk-file-names <pattern>', 'Pattern for chunk file names (e.g., [name]-[hash].js)')
  .option('-l, --liveReload', 'Enable live reload when in watch mode')
  .option('--plugins <plugins>', 'Comma-separated list of plugins to use')
  .option('--plugin-config <path>', 'Path to plugin configuration file')
  .action(async (input: string, flags: CliFlags) => {
    try {
      const cwd = process.cwd();
      const absolutePath = path.resolve(cwd, input);

      logger.info(`Bundle configuration: ${JSON.stringify({
        cwd,
        input,
        absolutePath,
        fileExists: fs.existsSync(absolutePath),
        progress: flags.progress
      }, null, 2)}`);

      const options = {
        input: absolutePath,
        format: flags.format as 'esm' | 'umd' | 'cjs',
        minify: flags.minify,
        sourcemap: flags.sourcemap,
        outDir: flags.outDir && path.resolve(cwd, flags.outDir),
        watchDir: flags.watchDir,
        progress: flags.progress,
        chunkFileNames: flags.chunkFileNames,
        liveReload: flags.liveReload, // Added liveReload to options
        plugins: flags.plugins ? flags.plugins.split(',').map(p => p.trim()) : undefined,
        pluginConfigPath: flags.pluginConfig,
        watchMode: flags.watch
      };

      if (flags.watch) {
        logger.info('Starting watch mode...');
        const watcher = new Watcher(options);
        await watcher.start();

        process.on('SIGINT', () => {
          watcher.stop();
          process.exit(0);
        });
      } else {
        await bundle(options);
        logger.success('Bundle completed successfully!');
      }
    } catch (error: unknown) {
      const errorMessage = formatError(error);
      logger.error(`Failed to bundle: ${errorMessage}`);
      process.exit(1);
    }
  });

// Registra comandos do marketplace de plugins
registerMarketplaceCommands(program);

// Registra comandos de estratégias de bundling
registerBundlingStrategyCommands(program);

// Importa e registra comandos de patrocínio
import { setupSponsorCommands } from './commands/sponsor';
setupSponsorCommands(program);

program.parse(process.argv);