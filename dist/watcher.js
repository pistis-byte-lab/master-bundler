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
        this.lastState = null;
        this.changeTimeout = null;
        this.options = {
            ...options,
            watchDir: options.watchDir || path_1.default.dirname(options.input)
        };
    }
    async waitForFileStability(filePath, timeout = 5000, interval = 100) {
        const start = Date.now();
        let lastState = null;
        let stableCount = 0;
        while (Date.now() - start < timeout) {
            try {
                const stats = fs_1.default.statSync(filePath);
                const content = fs_1.default.readFileSync(filePath, 'utf-8');
                const currentState = { content, mtime: stats.mtime, size: stats.size };
                if (lastState &&
                    currentState.content === lastState.content &&
                    currentState.size === lastState.size &&
                    currentState.mtime.getTime() === lastState.mtime.getTime()) {
                    stableCount++;
                    if (stableCount >= 3) { // File needs to be stable for 3 checks
                        logger_1.logger.info(`File stabilized: ${filePath}`);
                        return currentState;
                    }
                }
                else {
                    stableCount = 0;
                    lastState = currentState;
                }
            }
            catch (error) {
                logger_1.logger.error(`Error checking file stability: ${error}`);
                stableCount = 0;
            }
            await new Promise(resolve => setTimeout(resolve, interval));
        }
        logger_1.logger.warning('File did not stabilize within timeout');
        return null;
    }
    async rebuild(filePath) {
        if (this.rebuilding) {
            logger_2.logger.info('Rebuild already in progress, skipping');
            return;
        }
        try {
            this.rebuilding = true;
            logger_2.logger.info(`Starting rebuild for: ${filePath}`);
            // Wait for file to stabilize
            const fileState = await this.waitForFileStability(filePath);
            if (!fileState) {
                logger_2.logger.warning('Could not verify file stability');
                return;
            }
            // Skip if content hasn't changed
            if (this.lastState &&
                fileState.content === this.lastState.content &&
                fileState.size === this.lastState.size &&
                fileState.mtime.getTime() === this.lastState.mtime.getTime()) {
                logger_2.logger.info('No changes detected, skipping rebuild');
                return;
            }
            // Update last known state
            this.lastState = fileState;
            // Extra delay to ensure file system sync
            await new Promise(resolve => setTimeout(resolve, 1000));
            // Verify content again before rebuild
            import chokidar from 'chokidar';
            import { logger } from './utils/logger';
            import { bundle } from './bundler';
            import { BundleOptions } from './types';
            import path from 'path';
            import fs from 'fs';
            import WebSocket from 'ws';
            let wss = null;
            let lastBuildTimestamp = 0;
            const buildDebounceTime = 500; // ms
            let buildTimeout = null;
            let isFirstBuild = true;
            export async function startWatcher(options) {
                const watchDir = options.watchDir || path_2.default.dirname(options.input);
                logger_2.logger.info(`Watching directory: ${watchDir}`);
                if (options.liveReload) {
                    startLiveReloadServer();
                }
                // Initial build
                try {
                    await performBuild(options);
                    isFirstBuild = false;
                }
                catch (error) {
                    logger_2.logger.error('Initial build failed:', error);
                }
                const watcher = chokidar_1.default.watch(watchDir, {
                    ignored: ['**/node_modules/**', '**/dist/**'],
                    persistent: true,
                    ignoreInitial: true,
                    awaitWriteFinish: {
                        stabilityThreshold: 300,
                        pollInterval: 100
                    }
                });
                watcher
                    .on('add', (filePath) => handleFileChange('added', filePath, options))
                    .on('change', (filePath) => handleFileChange('changed', filePath, options))
                    .on('unlink', (filePath) => handleFileChange('removed', filePath, options))
                    .on('error', (error) => logger_2.logger.error(`Watcher error: ${error}`));
                logger_2.logger.info('Watching for file changes...');
            }
            async function handleFileChange(type, filePath, options) {
                logger_2.logger.info(`File ${type}: ${filePath}`);
                // Ensure file stability (in case of editors that write in chunks)
                try {
                    if (type !== 'removed' && fs_2.default.existsSync(filePath)) {
                        const stats = fs_2.default.statSync(filePath);
                        if (Date.now() - stats.mtimeMs < 100) {
                            logger_2.logger.debug('File is still being written, waiting for stability...');
                            return;
                        }
                    }
                }
                catch (error) {
                    logger_2.logger.error('Error checking file stability:', error);
                }
                // Debounce build
                if (buildTimeout) {
                    clearTimeout(buildTimeout);
                }
                buildTimeout = setTimeout(async () => {
                    try {
                        await performBuild(options);
                        if (options.liveReload) {
                            notifyBrowsersOfChange();
                        }
                    }
                    catch (error) {
                        logger_2.logger.error('Build failed:', error);
                    }
                }, buildDebounceTime);
            }
            async function performBuild(options) {
                const startTime = Date.now();
                lastBuildTimestamp = startTime;
                logger_2.logger.info('Rebuilding...');
                try {
                    await (0, bundler_2.bundle)(options);
                    logger_2.logger.info(`Build completed in ${Date.now() - startTime}ms`);
                }
                catch (error) {
                    logger_2.logger.error('Build error:', error);
                    throw error;
                }
            }
            // Live reload server
            function startLiveReloadServer() {
                if (wss) {
                    return; // Already running
                }
                const PORT = 8081;
                wss = new ws_1.default.Server({ port: PORT });
                wss.on('connection', (ws) => {
                    logger_2.logger.info('Live reload client connected');
                    ws.on('close', () => {
                        logger_2.logger.debug('Live reload client disconnected');
                    });
                });
                logger_2.logger.info(`Live reload server started on port ${PORT}`);
                // Add live reload script to HTML files
                injectLiveReloadScript();
            }
            function notifyBrowsersOfChange() {
                if (!wss)
                    return;
                logger_2.logger.debug('Notifying browsers of change');
                wss.clients.forEach((client) => {
                    if (client.readyState === ws_1.default.OPEN) {
                        client.send(JSON.stringify({ type: 'reload', timestamp: Date.now() }));
                    }
                });
            }
            function injectLiveReloadScript() {
                const liveReloadScript = `
<script>
  (function() {
    // Master Bundler live reload
    const socket = new WebSocket('ws://' + window.location.hostname + ':8081');
    socket.addEventListener('message', (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'reload') {
        window.location.reload();
      }
    });
    socket.addEventListener('close', () => {
      console.log('Live reload connection closed. Attempting to reconnect in 5s...');
      setTimeout(() => { 
        window.location.reload();
      }, 5000);
    });
  })();
</script>
  `;
                // Find all HTML files in output directory and inject the script
                const outputDir = path_2.default.resolve(process.cwd(), 'dist');
                if (fs_2.default.existsSync(outputDir)) {
                    injectScriptToDirectory(outputDir, liveReloadScript);
                }
            }
            function injectScriptToDirectory(dir, script) {
                try {
                    const files = fs_2.default.readdirSync(dir);
                    files.forEach(file => {
                        const filePath = path_2.default.join(dir, file);
                        const stats = fs_2.default.statSync(filePath);
                        if (stats.isDirectory()) {
                            injectScriptToDirectory(filePath, script);
                        }
                        else if (file.endsWith('.html')) {
                            const content = fs_2.default.readFileSync(filePath, 'utf8');
                            if (!content.includes('ws://') && content.includes('</body>')) {
                                const newContent = content.replace('</body>', `${script}</body>`);
                                fs_2.default.writeFileSync(filePath, newContent);
                                logger_2.logger.debug(`Injected live reload script into ${filePath}`);
                            }
                        }
                    });
                }
                catch (error) {
                    logger_2.logger.error('Error injecting live reload script:', error);
                }
            }
            const verifyState = await this.waitForFileStability(filePath);
            if (!verifyState || verifyState.content !== fileState.content) {
                logger_2.logger.warning('File content changed during stability check');
                return;
            }
            logger_2.logger.info(`Rebuilding with content: ${fileState.content}`);
            await (0, bundler_2.bundle)(this.options);
            logger_2.logger.success('Rebuild completed');
            // Verify output
            const outputPath = path_2.default.join(this.options.outDir || path_2.default.join(path_2.default.dirname(this.options.input), 'dist'), `${path_2.default.basename(this.options.input, path_2.default.extname(this.options.input))}.${this.options.format || 'esm'}.mjs`);
            if (fs_2.default.existsSync(outputPath)) {
                const stats = fs_2.default.statSync(outputPath);
                const content = fs_2.default.readFileSync(outputPath, 'utf-8');
                logger_2.logger.info(`Output file stats - mtime: ${stats.mtime.toISOString()}, size: ${stats.size} bytes`);
                logger_2.logger.info(`Output content: ${content}`);
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger_2.logger.error(`Rebuild failed: ${errorMessage}`);
        }
        finally {
            this.rebuilding = false;
        }
    }
    async start() {
        try {
            logger_1.logger.info('Performing initial build...');
            await (0, bundler_1.bundle)(this.options);
            logger_1.logger.success('Initial build completed');
            const watchPath = path_1.default.join(this.options.watchDir, '**/*.{ts,tsx}');
            logger_1.logger.info(`Starting watch mode on: ${watchPath}`);
            // Store initial state
            const stats = fs_1.default.statSync(this.options.input);
            const content = fs_1.default.readFileSync(this.options.input, 'utf-8');
            this.lastState = {
                content,
                mtime: stats.mtime,
                size: stats.size
            };
            logger_1.logger.info(`Initial file stats - mtime: ${stats.mtime.toISOString()}, size: ${stats.size} bytes`);
            logger_1.logger.info(`Initial content: ${content}`);
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
                .on('change', (filePath) => {
                logger_1.logger.info(`File changed: ${filePath}`);
                // Clear any pending rebuild timeout
                if (this.changeTimeout) {
                    clearTimeout(this.changeTimeout);
                }
                // Schedule a new rebuild with delay
                this.changeTimeout = setTimeout(() => {
                    this.rebuild(filePath);
                }, 1000);
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
            // Clear any pending rebuild timeout
            if (this.changeTimeout) {
                clearTimeout(this.changeTimeout);
                this.changeTimeout = null;
            }
            // Wait for any in-progress rebuild to complete
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