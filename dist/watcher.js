"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Watcher = void 0;
const chokidar = __importStar(require("chokidar"));
const bundler_1 = require("./bundler");
const logger_1 = require("./utils/logger");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
class Watcher {
    constructor(options) {
        this.watcher = null;
        this.rebuilding = false;
        this.lastChange = null;
        this.pendingChange = null;
        this.options = {
            ...options,
            watchDir: options.watchDir || path_1.default.dirname(options.input)
        };
    }
    async verifyFile(filePath) {
        try {
            const stats = fs_1.default.statSync(filePath);
            const content = fs_1.default.readFileSync(filePath, 'utf-8');
            logger_1.logger.info(`File verification - mtime: ${stats.mtime.toISOString()}, size: ${stats.size} bytes`);
            logger_1.logger.info(`Current content: ${content}`);
            return { filePath, content, mtime: stats.mtime };
        }
        catch (error) {
            logger_1.logger.error(`File verification failed: ${error}`);
            return null;
        }
    }
    async processFileChange(filePath) {
        try {
            // Verify file state
            const change = await this.verifyFile(filePath);
            if (!change) {
                logger_1.logger.warning('Could not verify file state');
                return;
            }
            // Skip if nothing has changed
            if (this.lastChange &&
                change.content === this.lastChange.content &&
                change.mtime.getTime() === this.lastChange.mtime.getTime()) {
                logger_1.logger.info('No changes detected, skipping rebuild');
                return;
            }
            this.rebuilding = true;
            this.lastChange = change;
            logger_1.logger.info(`Starting rebuild for: ${filePath}`);
            // Wait for file system to stabilize
            await new Promise(resolve => setTimeout(resolve, 1000));
            // Perform rebuild
            await (0, bundler_1.bundle)(this.options);
            logger_1.logger.success('Rebuild completed');
            // Check output
            const outputPath = path_1.default.join(this.options.outDir || path_1.default.join(path_1.default.dirname(this.options.input), 'dist'), `${path_1.default.basename(this.options.input, path_1.default.extname(this.options.input))}.${this.options.format || 'esm'}.mjs`);
            if (fs_1.default.existsSync(outputPath)) {
                const outputContent = fs_1.default.readFileSync(outputPath, 'utf-8');
                const outputStats = fs_1.default.statSync(outputPath);
                logger_1.logger.info(`Output file stats - mtime: ${outputStats.mtime.toISOString()}, size: ${outputStats.size} bytes`);
                logger_1.logger.info(`Output content: ${outputContent}`);
            }
            // Process any pending change
            if (this.pendingChange) {
                const nextChange = this.pendingChange;
                this.pendingChange = null;
                await this.processFileChange(nextChange.filePath);
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger_1.logger.error(`Rebuild failed: ${errorMessage}`);
        }
        finally {
            this.rebuilding = false;
        }
    }
    async start() {
        try {
            // Initial build
            logger_1.logger.info('Performing initial build...');
            await (0, bundler_1.bundle)(this.options);
            logger_1.logger.success('Initial build completed');
            const watchPath = path_1.default.join(this.options.watchDir, '**/*.{ts,tsx}');
            logger_1.logger.info(`Starting watch mode on: ${watchPath}`);
            // Store initial state
            const initialState = await this.verifyFile(this.options.input);
            if (initialState) {
                this.lastChange = initialState;
                logger_1.logger.info(`Initial file stats - mtime: ${initialState.mtime.toISOString()}`);
                logger_1.logger.info(`Initial content: ${initialState.content}`);
            }
            this.watcher = chokidar.watch(watchPath, {
                ignored: ['**/node_modules/**', '**/dist/**'],
                persistent: true,
                ignoreInitial: true,
                ignorePermissionErrors: true,
                awaitWriteFinish: {
                    stabilityThreshold: 2000,
                    pollInterval: 200
                },
                usePolling: true,
                interval: 200
            });
            this.watcher
                .on('change', async (filePath) => {
                logger_1.logger.info(`File changed: ${filePath}`);
                const change = await this.verifyFile(filePath);
                if (!change)
                    return;
                if (this.rebuilding) {
                    logger_1.logger.info('Rebuild in progress, queueing change');
                    this.pendingChange = change;
                }
                else {
                    await this.processFileChange(filePath);
                }
            })
                .on('error', (err) => {
                const errorMessage = err instanceof Error ? err.message : String(err);
                logger_1.logger.error(`Watcher error: ${errorMessage}`);
            });
            await new Promise((resolve) => {
                this.watcher.on('ready', () => {
                    logger_1.logger.info('Initial scan complete');
                    resolve();
                });
            });
            logger_1.logger.info('Watcher started successfully');
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger_1.logger.error(`Failed to start watcher: ${errorMessage}`);
            throw error;
        }
    }
    async stop() {
        if (this.watcher) {
            while (this.rebuilding) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            await this.watcher.close();
            this.watcher = null;
            logger_1.logger.info('Watcher stopped');
        }
    }
}
exports.Watcher = Watcher;
//# sourceMappingURL=watcher.js.map