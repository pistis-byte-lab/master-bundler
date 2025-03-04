"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runDevServer = runDevServer;
exports.registerDevServerCommands = registerDevServerCommands;
const server_1 = require("./server");
const logger_1 = require("../utils/logger");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const open_1 = __importDefault(require("open"));
async function runDevServer(options = {}) {
    let finalOptions = { ...options };
    // Carregar configuração do arquivo de configuração, se fornecido
    if (options.config) {
        try {
            const configPath = path_1.default.resolve(process.cwd(), options.config);
            if (fs_1.default.existsSync(configPath)) {
                const configModule = require(configPath);
                const devServerConfig = configModule.devServer || {};
                finalOptions = { ...devServerConfig, ...finalOptions };
            }
            else {
                logger_1.logger.warning(`Arquivo de configuração não encontrado: ${options.config}`);
            }
        }
        catch (error) {
            logger_1.logger.error(`Erro ao carregar arquivo de configuração: ${error}`);
        }
    }
    // Iniciar o servidor
    const server = (0, server_1.createDevServer)(finalOptions);
    try {
        await server.start();
        // Abrir o navegador se a opção estiver habilitada
        if (finalOptions.open) {
            const url = `http://${finalOptions.hostname || 'localhost'}:${finalOptions.port || 3000}`;
            (0, open_1.default)(url);
        }
        // Gerenciar encerramento gracioso
        const handleExit = async () => {
            logger_1.logger.info('Encerrando servidor de desenvolvimento...');
            await server.stop();
            process.exit(0);
        };
        process.on('SIGINT', handleExit);
        process.on('SIGTERM', handleExit);
    }
    catch (error) {
        logger_1.logger.error(`Falha ao iniciar servidor de desenvolvimento: ${error}`);
        process.exit(1);
    }
}
function registerDevServerCommands(program) {
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
        const options = {
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
//# sourceMappingURL=cli.js.map