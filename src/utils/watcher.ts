
import chokidar from 'chokidar';
import { logger } from './logger';
import { bundle } from '../bundler';
import { BundleOptions } from '../types';
import path from 'path';
import fs from 'fs';
import WebSocket from 'ws';

interface WatchOptions extends BundleOptions {
  watchDir?: string;
  liveReload?: boolean;
}

/**
 * Start watching files for changes and rebuild on change
 */
export async function startWatcher(options: WatchOptions): Promise<void> {
  const watchDir = options.watchDir || path.dirname(options.input);
  
  logger.info(`Watching for changes in ${watchDir}...`);
  
  // Initial build
  try {
    logger.info('Running initial build...');
    const result = await bundle(options);
    if (result) {
      logger.success(`Initial build successful: ${result.code.length} bytes`);
    }
  } catch (error) {
    logger.error('Initial build failed:', error instanceof Error ? error.message : String(error));
    // Continue watching even if initial build fails
  }
  
  // Setup websocket server for live reload if enabled
  const wss = options.liveReload ? createWebSocketServer() : null;
  
  const debounceTime = 300;
  let timeout: NodeJS.Timeout | null = null;
  let isBuilding = false;
  
  // Create watcher
  const watcher = chokidar.watch(watchDir, {
    ignored: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.git/**',
      path.resolve(options.outDir || 'dist', '**'),
    ],
    persistent: true,
    ignoreInitial: true,
  });
  
  // Handle file changes
  const handleChange = async (filePath: string) => {
    if (isBuilding) {
      // If already building, wait until it's done
      return;
    }
    
    logger.info(`File changed: ${filePath}`);
    
    // Debounce build
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(async () => {
      isBuilding = true;
      try {
        // Check if file has stopped changing
        const fileStable = await isFileStable(filePath);
        if (!fileStable) {
          logger.warn(`File ${filePath} is still being written, waiting...`);
          handleChange(filePath);
          return;
        }
        
        logger.info('Rebuilding...');
        const startTime = Date.now();
        const result = await bundle(options);
        const duration = Date.now() - startTime;
        
        if (result) {
          logger.success(`Rebuild successful (${duration}ms): ${result.code.length} bytes`);
          
          // Trigger live reload if enabled
          if (wss && options.liveReload) {
            notifyClients(wss);
          }
        }
      } catch (error) {
        logger.error('Build failed:', error instanceof Error ? error.message : String(error));
      } finally {
        isBuilding = false;
      }
    }, debounceTime);
  };
  
  watcher.on('change', handleChange);
  watcher.on('add', handleChange);
  watcher.on('unlink', (filePath) => {
    logger.info(`File deleted: ${filePath}`);
    handleChange(filePath);
  });
  
  watcher.on('error', (error) => {
    logger.error('Watcher error:', error instanceof Error ? error.message : String(error));
  });
  
  // Add live reload client script
  if (options.liveReload) {
    addLiveReloadScript(options);
  }
  
  process.on('SIGINT', () => {
    logger.info('Stopping watcher...');
    watcher.close();
    if (wss) {
      wss.close();
    }
    process.exit(0);
  });
}

/**
 * Check if a file has stopped changing
 */
async function isFileStable(filePath: string): Promise<boolean> {
  let lastSize = -1;
  let currentSize = -1;
  
  try {
    // Get initial size
    lastSize = fs.statSync(filePath).size;
    
    // Wait 100ms and check again
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Get current size
    currentSize = fs.statSync(filePath).size;
  } catch (error) {
    logger.debug(`Error checking file stability: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
  
  // If size hasn't changed, file is stable
  return lastSize === currentSize;
}

/**
 * Create WebSocket server for live reload
 */
function createWebSocketServer(): WebSocket.Server {
  const wss = new WebSocket.Server({ port: 35729 });
  logger.info('Live reload server started on port 35729');
  
  wss.on('connection', (ws) => {
    logger.debug('Live reload client connected');
    
    ws.on('close', () => {
      logger.debug('Live reload client disconnected');
    });
  });
  
  return wss;
}

/**
 * Notify all connected clients to reload
 */
function notifyClients(wss: WebSocket.Server): void {
  logger.debug('Notifying clients to reload');
  
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ command: 'reload' }));
    }
  });
}

/**
 * Add live reload script to HTML files
 */
function addLiveReloadScript(options: WatchOptions): void {
  // This function will add a live reload script to the output HTML files
  // Implementation depends on your bundler's HTML handling
  logger.info('Live reload enabled');
}
