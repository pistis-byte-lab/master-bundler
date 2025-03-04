
import { Command } from 'commander';
import { createDevServer, DevServerOptions } from './server';
import { logger } from '../utils/logger';
import path from 'path';
import fs from 'fs';
import open from 'open';

export interface DevServerCliOptions extends DevServerOptions {
  config?: string;
}

export async function runDevServer(options: Partial<DevServerCliOptions> = {}): Promise<void> {
  let finalOptions: Partial<DevServerOptions> = { ...options };

  // Carregar configuração do arquivo de configuração, se fornecido
  if (options.config) {
    try {
      const configPath = path.resolve(process.cwd(), options.config);
      if (fs.existsSync(configPath)) {
        const configModule = require(configPath);
        const devServerConfig = configModule.devServer || {};
        finalOptions = { ...devServerConfig, ...finalOptions };
      } else {
        logger.warning(`Arquivo de configuração não encontrado: ${options.config}`);
      }
    } catch (error) {
      logger.error(`Erro ao carregar arquivo de configuração: ${error}`);
    }
  }

  // Iniciar o servidor
  const server = createDevServer(finalOptions);
  
  try {
    await server.start();
    
    // Abrir o navegador se a opção estiver habilitada
    if (finalOptions.open) {
      const url = `http://${finalOptions.hostname || 'localhost'}:${finalOptions.port || 3000}`;
      open(url);
    }
    
    // Gerenciar encerramento gracioso
    const handleExit = async () => {
      logger.info('Encerrando servidor de desenvolvimento...');
      await server.stop();
      process.exit(0);
    };
    
    process.on('SIGINT', handleExit);
    process.on('SIGTERM', handleExit);
    
  } catch (error) {
    logger.error(`Falha ao iniciar servidor de desenvolvimento: ${error}`);
    process.exit(1);
  }
}

export function registerDevServerCommands(program: Command): void {
  program
    .command('serve')
    .description('Inicia o servidor de desenvolvimento')
    .option('-p, --port <number>', 'Porta para o servidor (padrão: 3000)')
    .option('-c, --content-base <path>', 'Diretório raiz para servir arquivos (padrão: dist)')
    .option('-l, --live-reload', 'Ativar live reload (padrão: true)', true)
    .option('--no-live-reload', 'Desativar live reload')
    .option('-o, --overlay', 'Mostrar sobreposição de erros (padrão: true)', true)
    .option('--no-overlay', 'Desativar sobreposição de erros')
    .option('--open', 'Abrir navegador automaticamente')
    .option('--config <path>', 'Caminho para o arquivo de configuração')
    .option('--hostname <hostname>', 'Hostname para o servidor (padrão: 0.0.0.0)')
    .action(async (cmdOptions) => {
      const options: Partial<DevServerOptions> = {
        port: cmdOptions.port ? parseInt(cmdOptions.port, 10) : undefined,
        contentBase: cmdOptions.contentBase,
        liveReload: cmdOptions.liveReload,
        overlay: cmdOptions.overlay,
        open: cmdOptions.open,
        hostname: cmdOptions.hostname,
        config: cmdOptions.config
      };
      
      await runDevServer(options);
    });
}
