
import express from 'express';
import http from 'http';
import path from 'path';
import WebSocket from 'ws';
import chokidar from 'chokidar';
import { logger } from '../utils/logger';

export interface DevServerOptions {
  port: number;
  contentBase: string;
  liveReload: boolean;
  overlay: boolean;
  proxy?: Record<string, string>;
  open?: boolean;
  hostname?: string;
}

export class DevServer {
  private app: express.Application;
  private server: http.Server;
  private wss: WebSocket.Server;
  private options: DevServerOptions;
  private watcher: chokidar.FSWatcher | null = null;

  constructor(options: Partial<DevServerOptions> = {}) {
    this.options = {
      port: options.port || 3000,
      contentBase: options.contentBase || 'dist',
      liveReload: options.liveReload !== false,
      overlay: options.overlay !== false,
      proxy: options.proxy || {},
      open: options.open || false,
      hostname: options.hostname || '0.0.0.0',
    };

    this.app = express();
    this.server = http.createServer(this.app);
    this.wss = new WebSocket.Server({ server: this.server });

    this.setupMiddleware();
    this.setupWebSocket();
  }

  private setupMiddleware(): void {
    // Middleware para servir arquivos estáticos
    this.app.use(express.static(this.options.contentBase));

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
        res.sendFile(path.join(process.cwd(), this.options.contentBase, 'index.html'));
      } else {
        next();
      }
    });
  }

  private setupWebSocket(): void {
    this.wss.on('connection', (ws) => {
      logger.info('Cliente conectado ao WebSocket');
      
      ws.on('close', () => {
        logger.info('Cliente desconectado do WebSocket');
      });
    });
  }

  private injectLiveReloadScript(html: string): string {
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

  private watchFiles(): void {
    if (!this.options.liveReload) return;

    const contentBasePath = path.resolve(process.cwd(), this.options.contentBase);
    this.watcher = chokidar.watch(contentBasePath, {
      ignored: /(^|[\/\\])\../, // ignorar arquivos e pastas ocultos
      persistent: true
    });

    this.watcher.on('change', (filePath) => {
      logger.info(`Arquivo alterado: ${filePath}`);
      this.notifyClients();
    });
  }

  private notifyClients(): void {
    const message = JSON.stringify({ type: 'reload' });
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  public start(): Promise<void> {
    return new Promise((resolve) => {
      this.server.listen(this.options.port, this.options.hostname, () => {
        logger.success(`Servidor de desenvolvimento rodando em http://${this.options.hostname}:${this.options.port}`);
        
        if (this.options.liveReload) {
          this.watchFiles();
          logger.info('Live reload ativado');
        }
        
        resolve();
      });
    });
  }

  public stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.watcher) {
        this.watcher.close();
      }
      
      this.server.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}

// Função auxiliar para criar o servidor de desenvolvimento
export function createDevServer(options?: Partial<DevServerOptions>): DevServer {
  return new DevServer(options);
}
