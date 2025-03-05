
import express from 'express';
import path from 'path';
import http from 'http';
import { logger } from './utils/logger';
import { bundle } from './bundler';
import { BundleOptions } from './types';
// Importação corrigida após implementação do watcher
import { startWatcher } from './utils/watcher';
import WebSocket from 'ws';
import fs from 'fs';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors';
import serveIndex from 'serve-index';
import compression from 'compression';

export interface DevServerOptions {
  port?: number;
  host?: string;
  contentBase?: string;
  open?: boolean;
  proxy?: Record<string, string | { target: string, pathRewrite?: Record<string, string> }>;
  middleware?: express.RequestHandler[];
  bundleOptions: BundleOptions;
}

export async function startDevServer(options: DevServerOptions): Promise<http.Server> {
  const {
    port = 3000,
    host = '0.0.0.0',
    contentBase = 'dist',
    proxy = {},
    middleware = [],
    bundleOptions
  } = options;

  // Create Express app
  const app = express();
  
  // Apply compression
  app.use(compression());
  
  // Enable CORS
  app.use(cors());
  
  // Add custom middleware
  middleware.forEach(mw => app.use(mw));
  
  // Setup proxy
  Object.entries(proxy).forEach(([context, config]) => {
    if (typeof config === 'string') {
      app.use(context, createProxyMiddleware({
        target: config,
        changeOrigin: true,
        logLevel: 'warn'
      }));
    } else {
      app.use(context, createProxyMiddleware({
        ...config,
        changeOrigin: true,
        logLevel: 'warn'
      }));
    }
  });
  
  // Ensure output directory exists
  const outputPath = path.resolve(process.cwd(), contentBase);
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }
  
  // Setup static file serving
  app.use(express.static(outputPath));
  
  // Add directory listing
  app.use(serveIndex(outputPath, { icons: true }));
  
  // Handle 404s
  app.use((req, res) => {
    if (req.path.includes('.') && !req.path.endsWith('.html')) {
      res.status(404).send(`Not found: ${req.path}`);
      return;
    }
    
    // For SPA-like navigation, serve index.html for non-file requests
    const indexPath = path.join(outputPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send(`Not found: ${req.path}`);
    }
  });
  
  // Create HTTP server
  const server = http.createServer(app);
  
  // Setup WebSocket server for live reload
  const wss = new WebSocket.Server({ server });
  
  wss.on('connection', (ws) => {
    logger.debug('Live reload client connected');
    
    ws.on('close', () => {
      logger.debug('Live reload client disconnected');
    });
  });
  
  // Start bundling and watching for changes
  try {
    // Initial build
    await bundle(bundleOptions);
    
    // Start watching
    const watchDir = bundleOptions.watchDir || path.dirname(bundleOptions.input as string);
    startFileWatcher(watchDir, bundleOptions, wss);
    
    // Start server
    server.listen(port, host, () => {
      const protocol = 'http';
      logger.info(`Development server running at ${protocol}://${host === '0.0.0.0' ? 'localhost' : host}:${port}`);
      
      // Open browser if requested
      if (options.open) {
        const open = require('open');
        open(`${protocol}://${host === '0.0.0.0' ? 'localhost' : host}:${port}`);
      }
    });
    
    return server;
  } catch (error) {
    logger.error('Failed to start development server:', error);
    throw error;
  }
}

function startFileWatcher(
  watchDir: string,
  options: BundleOptions,
  wss: WebSocket.Server
): void {
  // Create a function to notify clients of changes
  const notifyClients = () => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'reload', timestamp: Date.now() }));
      }
    });
  };
  
  // Inject the live reload script into HTML files after build
  const originalBundle = bundle;
  (bundle as any) = async (options: BundleOptions) => {
    const result = await originalBundle(options);
    
    // If HTML output, inject live reload script
    if (options.output && options.output.endsWith('.html')) {
      injectLiveReloadScript(options.output);
    } else if (options.outDir) {
      injectLiveReloadScriptToDir(options.outDir);
    }
    
    return result;
  };
  
  // Set up file watching
  startWatcher({
    ...options,
    watchDir,
    liveReload: false // We handle this ourselves
  }).then(() => {
    logger.info('File watcher started');
    
    // Notify clients when files change
    const chokidar = require('chokidar');
    const watcher = chokidar.watch(watchDir, {
      ignored: ['**/node_modules/**', '**/dist/**'],
      persistent: true,
      ignoreInitial: true
    });
    
    let debounceTimeout: NodeJS.Timeout | null = null;
    
    watcher.on('all', () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
      
      debounceTimeout = setTimeout(() => {
        logger.info('Files changed, notifying clients...');
        notifyClients();
      }, 100);
    });
  });
}

function injectLiveReloadScript(filePath: string): void {
  if (!fs.existsSync(filePath)) {
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Only inject if not already injected
  if (content.includes('__webpack_reload__')) {
    return;
  }
  
  const script = `
<script>
  (function() {
    var socket = new WebSocket('ws://' + window.location.host);
    socket.addEventListener('message', function(event) {
      var data = JSON.parse(event.data);
      if (data.type === 'reload') {
        window.location.reload();
      }
    });
    socket.addEventListener('close', function() {
      console.log('Dev server connection closed. Attempting to reconnect...');
      setTimeout(function() { window.location.reload(); }, 2000);
    });
    window.__webpack_reload__ = true;
  })();
</script>
  `;
  
  // Insert before closing body tag
  const newContent = content.replace('</body>', script + '</body>');
  fs.writeFileSync(filePath, newContent);
}

function injectLiveReloadScriptToDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    return;
  }
  
  const files = fs.readdirSync(dir);
  
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      injectLiveReloadScriptToDir(filePath);
    } else if (file.endsWith('.html')) {
      injectLiveReloadScript(filePath);
    }
  });
}
