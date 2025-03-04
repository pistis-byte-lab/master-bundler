"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startDevServer = startDevServer;
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const http_1 = __importDefault(require("http"));
const logger_1 = require("./utils/logger");
const bundler_1 = require("./bundler");
const watcher_1 = require("./watcher");
const ws_1 = __importDefault(require("ws"));
const fs_1 = __importDefault(require("fs"));
const http_proxy_middleware_1 = require("http-proxy-middleware");
const cors_1 = __importDefault(require("cors"));
const serve_index_1 = __importDefault(require("serve-index"));
const compression_1 = __importDefault(require("compression"));
async function startDevServer(options) {
    const { port = 3000, host = '0.0.0.0', contentBase = 'dist', proxy = {}, middleware = [], bundleOptions } = options;
    // Create Express app
    const app = (0, express_1.default)();
    // Apply compression
    app.use((0, compression_1.default)());
    // Enable CORS
    app.use((0, cors_1.default)());
    // Add custom middleware
    middleware.forEach(mw => app.use(mw));
    // Setup proxy
    Object.entries(proxy).forEach(([context, config]) => {
        if (typeof config === 'string') {
            app.use(context, (0, http_proxy_middleware_1.createProxyMiddleware)({
                target: config,
                changeOrigin: true,
                logLevel: 'warn'
            }));
        }
        else {
            app.use(context, (0, http_proxy_middleware_1.createProxyMiddleware)({
                ...config,
                changeOrigin: true,
                logLevel: 'warn'
            }));
        }
    });
    // Ensure output directory exists
    const outputPath = path_1.default.resolve(process.cwd(), contentBase);
    if (!fs_1.default.existsSync(outputPath)) {
        fs_1.default.mkdirSync(outputPath, { recursive: true });
    }
    // Setup static file serving
    app.use(express_1.default.static(outputPath));
    // Add directory listing
    app.use((0, serve_index_1.default)(outputPath, { icons: true }));
    // Handle 404s
    app.use((req, res) => {
        if (req.path.includes('.') && !req.path.endsWith('.html')) {
            res.status(404).send(`Not found: ${req.path}`);
            return;
        }
        // For SPA-like navigation, serve index.html for non-file requests
        const indexPath = path_1.default.join(outputPath, 'index.html');
        if (fs_1.default.existsSync(indexPath)) {
            res.sendFile(indexPath);
        }
        else {
            res.status(404).send(`Not found: ${req.path}`);
        }
    });
    // Create HTTP server
    const server = http_1.default.createServer(app);
    // Setup WebSocket server for live reload
    const wss = new ws_1.default.Server({ server });
    wss.on('connection', (ws) => {
        logger_1.logger.debug('Live reload client connected');
        ws.on('close', () => {
            logger_1.logger.debug('Live reload client disconnected');
        });
    });
    // Start bundling and watching for changes
    try {
        // Initial build
        await (0, bundler_1.bundle)(bundleOptions);
        // Start watching
        const watchDir = bundleOptions.watchDir || path_1.default.dirname(bundleOptions.input);
        startFileWatcher(watchDir, bundleOptions, wss);
        // Start server
        server.listen(port, host, () => {
            const protocol = 'http';
            logger_1.logger.info(`Development server running at ${protocol}://${host === '0.0.0.0' ? 'localhost' : host}:${port}`);
            // Open browser if requested
            if (options.open) {
                const open = require('open');
                open(`${protocol}://${host === '0.0.0.0' ? 'localhost' : host}:${port}`);
            }
        });
        return server;
    }
    catch (error) {
        logger_1.logger.error('Failed to start development server:', error);
        throw error;
    }
}
function startFileWatcher(watchDir, options, wss) {
    // Create a function to notify clients of changes
    const notifyClients = () => {
        wss.clients.forEach((client) => {
            if (client.readyState === ws_1.default.OPEN) {
                client.send(JSON.stringify({ type: 'reload', timestamp: Date.now() }));
            }
        });
    };
    // Inject the live reload script into HTML files after build
    const originalBundle = bundler_1.bundle;
    bundler_1.bundle = async (options) => {
        const result = await originalBundle(options);
        // If HTML output, inject live reload script
        if (options.output && options.output.endsWith('.html')) {
            injectLiveReloadScript(options.output);
        }
        else if (options.outDir) {
            injectLiveReloadScriptToDir(options.outDir);
        }
        return result;
    };
    // Set up file watching
    (0, watcher_1.startWatcher)({
        ...options,
        watchDir,
        liveReload: false // We handle this ourselves
    }).then(() => {
        logger_1.logger.info('File watcher started');
        // Notify clients when files change
        const chokidar = require('chokidar');
        const watcher = chokidar.watch(watchDir, {
            ignored: ['**/node_modules/**', '**/dist/**'],
            persistent: true,
            ignoreInitial: true
        });
        let debounceTimeout = null;
        watcher.on('all', () => {
            if (debounceTimeout) {
                clearTimeout(debounceTimeout);
            }
            debounceTimeout = setTimeout(() => {
                logger_1.logger.info('Files changed, notifying clients...');
                notifyClients();
            }, 100);
        });
    });
}
function injectLiveReloadScript(filePath) {
    if (!fs_1.default.existsSync(filePath)) {
        return;
    }
    const content = fs_1.default.readFileSync(filePath, 'utf8');
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
    fs_1.default.writeFileSync(filePath, newContent);
}
function injectLiveReloadScriptToDir(dir) {
    if (!fs_1.default.existsSync(dir)) {
        return;
    }
    const files = fs_1.default.readdirSync(dir);
    files.forEach((file) => {
        const filePath = path_1.default.join(dir, file);
        const stat = fs_1.default.statSync(filePath);
        if (stat.isDirectory()) {
            injectLiveReloadScriptToDir(filePath);
        }
        else if (file.endsWith('.html')) {
            injectLiveReloadScript(filePath);
        }
    });
}
//# sourceMappingURL=server.js.map