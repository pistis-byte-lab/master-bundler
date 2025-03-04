import * as chokidar from 'chokidar';
import { bundle } from './bundler';
import { BundleOptions } from './types';
import { logger } from './utils/logger';
import path from 'path';
import fs from 'fs';

interface WatchOptions extends BundleOptions {
  watchDir?: string;
}

interface FileState {
  content: string;
  mtime: Date;
  size: number;
}

export class Watcher {
  private watcher: chokidar.FSWatcher | null = null;
  private options: WatchOptions;
  private rebuilding = false;
  private lastState: FileState | null = null;
  private changeTimeout: NodeJS.Timeout | null = null;

  constructor(options: WatchOptions) {
    this.options = {
      ...options,
      watchDir: options.watchDir || path.dirname(options.input)
    };
  }

  private async waitForFileStability(filePath: string, timeout = 5000, interval = 100): Promise<FileState | null> {
    const start = Date.now();
    let lastState: FileState | null = null;
    let stableCount = 0;

    while (Date.now() - start < timeout) {
      try {
        const stats = fs.statSync(filePath);
        const content = fs.readFileSync(filePath, 'utf-8');
        const currentState = { content, mtime: stats.mtime, size: stats.size };

        if (lastState && 
            currentState.content === lastState.content && 
            currentState.size === lastState.size &&
            currentState.mtime.getTime() === lastState.mtime.getTime()) {
          stableCount++;
          if (stableCount >= 3) { // File needs to be stable for 3 checks
            logger.info(`File stabilized: ${filePath}`);
            return currentState;
          }
        } else {
          stableCount = 0;
          lastState = currentState;
        }
      } catch (error) {
        logger.error(`Error checking file stability: ${error}`);
        stableCount = 0;
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }

    logger.warning('File did not stabilize within timeout');
    return null;
  }

  private async rebuild(filePath: string): Promise<void> {
    if (this.rebuilding) {
      logger.info('Rebuild already in progress, skipping');
      return;
    }

    try {
      this.rebuilding = true;
      logger.info(`Starting rebuild for: ${filePath}`);

      // Wait for file to stabilize
      const fileState = await this.waitForFileStability(filePath);
      if (!fileState) {
        logger.warning('Could not verify file stability');
        return;
      }

      // Skip if content hasn't changed
      if (this.lastState && 
          fileState.content === this.lastState.content && 
          fileState.size === this.lastState.size &&
          fileState.mtime.getTime() === this.lastState.mtime.getTime()) {
        logger.info('No changes detected, skipping rebuild');
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

let wss: WebSocket.Server | null = null;
let lastBuildTimestamp = 0;
const buildDebounceTime = 500; // ms
let buildTimeout: NodeJS.Timeout | null = null;
let isFirstBuild = true;

export async function startWatcher(options: BundleOptions & { watchDir?: string, liveReload?: boolean }): Promise<void> {
  const watchDir = options.watchDir || path.dirname(options.input);
  logger.info(`Watching directory: ${watchDir}`);

  if (options.liveReload) {
    startLiveReloadServer();
  }

  // Initial build
  try {
    await performBuild(options);
    isFirstBuild = false;
  } catch (error) {
    logger.error('Initial build failed:', error);
  }

  const watcher = chokidar.watch(watchDir, {
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
    .on('error', (error) => logger.error(`Watcher error: ${error}`));

  logger.info('Watching for file changes...');
}

async function handleFileChange(type: 'added' | 'changed' | 'removed', filePath: string, options: BundleOptions & { liveReload?: boolean }): Promise<void> {
  logger.info(`File ${type}: ${filePath}`);
  
  // Ensure file stability (in case of editors that write in chunks)
  try {
    if (type !== 'removed' && fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      if (Date.now() - stats.mtimeMs < 100) {
        logger.debug('File is still being written, waiting for stability...');
        return;
      }
    }
  } catch (error) {
    logger.error('Error checking file stability:', error);
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
    } catch (error) {
      logger.error('Build failed:', error);
    }
  }, buildDebounceTime);
}

async function performBuild(options: BundleOptions): Promise<void> {
  const startTime = Date.now();
  lastBuildTimestamp = startTime;
  
  logger.info('Rebuilding...');
  
  try {
    await bundle(options);
    logger.info(`Build completed in ${Date.now() - startTime}ms`);
  } catch (error) {
    logger.error('Build error:', error);
    throw error;
  }
}

// Live reload server
function startLiveReloadServer(): void {
  if (wss) {
    return; // Already running
  }

  const PORT = 8081;
  wss = new WebSocket.Server({ port: PORT });
  
  wss.on('connection', (ws) => {
    logger.info('Live reload client connected');
    
    ws.on('close', () => {
      logger.debug('Live reload client disconnected');
    });
  });
  
  logger.info(`Live reload server started on port ${PORT}`);
  
  // Add live reload script to HTML files
  injectLiveReloadScript();
}

function notifyBrowsersOfChange(): void {
  if (!wss) return;
  
  logger.debug('Notifying browsers of change');
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'reload', timestamp: Date.now() }));
    }
  });
}

function injectLiveReloadScript(): void {
  const liveReloadScript = `
<script>
  (function() {
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
  const outputDir = path.resolve(process.cwd(), 'dist');
  if (fs.existsSync(outputDir)) {
    injectScriptToDirectory(outputDir, liveReloadScript);
  }
}

function injectScriptToDirectory(dir: string, script: string): void {
  try {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        injectScriptToDirectory(filePath, script);
      } else if (file.endsWith('.html')) {
        const content = fs.readFileSync(filePath, 'utf8');
        if (!content.includes('ws://') && content.includes('</body>')) {
          const newContent = content.replace('</body>', `${script}</body>`);
          fs.writeFileSync(filePath, newContent);
          logger.debug(`Injected live reload script into ${filePath}`);
        }
      }
    });
  } catch (error) {
    logger.error('Error injecting live reload script:', error);
  }
}

      const verifyState = await this.waitForFileStability(filePath);
      if (!verifyState || verifyState.content !== fileState.content) {
        logger.warning('File content changed during stability check');
        return;
      }

      logger.info(`Rebuilding with content: ${fileState.content}`);
      await bundle(this.options);
      logger.success('Rebuild completed');

      // Verify output
      const outputPath = path.join(
        this.options.outDir || path.join(path.dirname(this.options.input), 'dist'),
        `${path.basename(this.options.input, path.extname(this.options.input))}.${this.options.format || 'esm'}.mjs`
      );

      if (fs.existsSync(outputPath)) {
        const stats = fs.statSync(outputPath);
        const content = fs.readFileSync(outputPath, 'utf-8');
        logger.info(`Output file stats - mtime: ${stats.mtime.toISOString()}, size: ${stats.size} bytes`);
        logger.info(`Output content: ${content}`);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Rebuild failed: ${errorMessage}`);
    } finally {
      this.rebuilding = false;
    }
  }

  public async start(): Promise<void> {
    try {
      logger.info('Performing initial build...');
      await bundle(this.options);
      logger.success('Initial build completed');

      const watchPath = path.join(this.options.watchDir!, '**/*.{ts,tsx}');
      logger.info(`Starting watch mode on: ${watchPath}`);

      // Store initial state
      const stats = fs.statSync(this.options.input);
      const content = fs.readFileSync(this.options.input, 'utf-8');
      this.lastState = {
        content,
        mtime: stats.mtime,
        size: stats.size
      };

      logger.info(`Initial file stats - mtime: ${stats.mtime.toISOString()}, size: ${stats.size} bytes`);
      logger.info(`Initial content: ${content}`);

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
          logger.info(`File changed: ${filePath}`);

          // Clear any pending rebuild timeout
          if (this.changeTimeout) {
            clearTimeout(this.changeTimeout);
          }

          // Schedule a new rebuild with delay
          this.changeTimeout = setTimeout(() => {
            this.rebuild(filePath);
          }, 1000);
        })
        .on('error', (err: unknown) => {
          const errorMessage = err instanceof Error ? err.message : String(err);
          logger.error(`Watcher error: ${errorMessage}`);
        });

      await new Promise<void>((resolve) => {
        this.watcher!.on('ready', () => {
          logger.info('Initial scan complete');
          resolve();
        });
      });

      logger.info('Watcher started successfully');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to start watcher: ${errorMessage}`);
      throw error;
    }
  }

  public async stop(): Promise<void> {
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
      logger.info('Watcher stopped');
    }
  }
}