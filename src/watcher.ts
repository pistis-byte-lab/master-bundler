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