#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const bundler_1 = require("./bundler");
const watcher_1 = require("./watcher");
const logger_1 = require("./utils/logger");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
commander_1.program
    .name('ts-bundler')
    .description('TypeScript bundler with multiple format support')
    .version('1.0.0');
commander_1.program
    .argument('<input>', 'Input file path')
    .option('-w, --watch', 'Watch mode')
    .option('-f, --format <format>', 'Output format (esm,umd,cjs)', 'esm')
    .option('-m, --minify', 'Minify output', true)
    .option('-s, --sourcemap', 'Generate source maps', true)
    .option('--out-dir <dir>', 'Output directory')
    .option('--watch-dir <dir>', 'Directory to watch in watch mode (defaults to input file directory)')
    .action(async (input, flags) => {
    try {
        const cwd = process.cwd();
        const absolutePath = path_1.default.resolve(cwd, input);
        logger_1.logger.info(`Bundle configuration: ${JSON.stringify({
            cwd,
            input,
            absolutePath,
            fileExists: fs_1.default.existsSync(absolutePath)
        }, null, 2)}`);
        const options = {
            input: absolutePath,
            format: flags.format,
            minify: flags.minify,
            sourcemap: flags.sourcemap,
            outDir: flags.outDir && path_1.default.resolve(cwd, flags.outDir),
            watchDir: flags.watchDir
        };
        if (flags.watch) {
            logger_1.logger.info('Starting watch mode...');
            const watcher = new watcher_1.Watcher(options);
            await watcher.start();
            process.on('SIGINT', () => {
                watcher.stop();
                process.exit(0);
            });
        }
        else {
            await (0, bundler_1.bundle)(options);
            logger_1.logger.success('Bundle completed successfully!');
        }
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger_1.logger.error(`Failed to bundle: ${errorMessage}`);
        process.exit(1);
    }
});
commander_1.program.parse();
//# sourceMappingURL=cli.js.map