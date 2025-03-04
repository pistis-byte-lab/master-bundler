"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DevServer = void 0;
exports.createDevServer = createDevServer;
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const path_1 = __importDefault(require("path"));
const ws_1 = __importDefault(require("ws"));
const chokidar_1 = __importDefault(require("chokidar"));
const logger_1 = require("../utils/logger");
class DevServer {
    constructor(options = {}) {
        this.watcher = null;
        this.options = {
            port: options.port || 3000,
            contentBase: options.contentBase || 'dist',
            liveReload: options.liveReload !== false,
            overlay: options.overlay !== false,
            proxy: options.proxy || {},
            open: options.open || false,
            hostname: options.hostname || '0.0.0.0',
        };
        this.app = (0, express_1.default)();
        this.server = http_1.default.createServer(this.app);
        this.wss = new ws_1.default.Server({ server: this.server });
        this.setupMiddleware();
        this.setupWebSocket();
    }
    setupMiddleware() {
        // Middleware para servir arquivos estáticos
        this.app.use(express_1.default.static(this.options.contentBase));
        // Middleware para injetar o script de live reload
        if (this.options.liveReload) {
            this.app.use((req, res, next) => {
                if (req.path.endsWith('.html') || req.path === '/') {
                    res.on('data', (chunk) => {
                        const html = chunk.toString();
                        const injectedHtml = this.injectLiveReloadScript(html);
                        res.write(Buffer.from(injectedHtml));
                    });
                }
                next();
            });
        }
        // Configurar proxy se fornecido
        if (this.options.proxy && Object.keys(this.options.proxy).length > 0) {
            const { createProxyMiddleware } = require('http-proxy-middleware');
            for (const [context, target] of Object.entries(this.options.proxy)) {
                this.app.use(context, createProxyMiddleware({
                    target,
                    changeOrigin: true,
                    logLevel: 'warn'
                }));
            }
        }
        // Fallback para SPA - redirecionar para index.html para rotas não encontradas
        this.app.use((req, res, next) => {
            if (req.method === 'GET' && !req.path.includes('.')) {
                res.sendFile(path_1.default.join(process.cwd(), this.options.contentBase, 'index.html'));
            }
            else {
                next();
            }
        });
    }
    setupWebSocket() {
        this.wss.on('connection', (ws) => {
            logger_1.logger.info('Cliente conectado ao WebSocket');
            ws.on('close', () => {
                logger_1.logger.info('Cliente desconectado do WebSocket');
            });
        });
    }
    injectLiveReloadScript(html) {
        const script = `
      <script>
        (function() {
          const socket = new WebSocket('ws://' + window.location.host);
          socket.addEventListener('message', function(event) {
            const data = JSON.parse(event.data);
            if (data.type === 'reload') {
              window.location.reload();
            }
          });
          socket.addEventListener('close', function() {
            console.log('WebSocket connection closed. Reconnecting...');
            setTimeout(function() {
              window.location.reload();
            }, 2000);
          });
          console.log('Live reload enabled');
        })();
      </script>
    `;
        const bodyEndIndex = html.indexOf('</body>');
        if (bodyEndIndex !== -1) {
            return html.slice(0, bodyEndIndex) + script + html.slice(bodyEndIndex);
        }
        return html + script;
    }
    watchFiles() {
        if (!this.options.liveReload)
            return;
        const contentBasePath = path_1.default.resolve(process.cwd(), this.options.contentBase);
        this.watcher = chokidar_1.default.watch(contentBasePath, {
            ignored: /(^|[\/\\])\../, // ignorar arquivos e pastas ocultos
            persistent: true
        });
        this.watcher.on('change', (filePath) => {
            logger_1.logger.info(`Arquivo alterado: ${filePath}`);
            this.notifyClients();
        });
    }
    notifyClients() {
        const message = JSON.stringify({ type: 'reload' });
        this.wss.clients.forEach((client) => {
            if (client.readyState === ws_1.default.OPEN) {
                client.send(message);
            }
        });
    }
    start() {
        return new Promise((resolve) => {
            this.server.listen(this.options.port, this.options.hostname, () => {
                logger_1.logger.success(`Servidor de desenvolvimento rodando em http://${this.options.hostname}:${this.options.port}`);
                if (this.options.liveReload) {
                    this.watchFiles();
                    logger_1.logger.info('Live reload ativado');
                }
                resolve();
            });
        });
    }
    stop() {
        return new Promise((resolve, reject) => {
            if (this.watcher) {
                this.watcher.close();
            }
            this.server.close((err) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve();
                }
            });
        });
    }
}
exports.DevServer = DevServer;
// Função auxiliar para criar o servidor de desenvolvimento
function createDevServer(options) {
    return new DevServer(options);
}
//# sourceMappingURL=server.js.map