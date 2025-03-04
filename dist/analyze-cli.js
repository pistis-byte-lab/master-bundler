"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAnalyzeCommands = registerAnalyzeCommands;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const analyzer_1 = require("./utils/analyzer");
const logger_1 = require("./utils/logger");
function registerAnalyzeCommands(program) {
    program
        .command('analyze')
        .description('Analisa um bundle e gera relatório de tamanho e composição')
        .option('-s, --stats <path>', 'Caminho para o arquivo de estatísticas do bundle')
        .option('-o, --output <path>', 'Caminho para o arquivo de saída do relatório', 'bundle-analysis.json')
        .action(async (options) => {
        try {
            if (!options.stats) {
                logger_1.logger.error('É necessário fornecer um arquivo de estatísticas do bundle (--stats)');
                process.exit(1);
            }
            const statsPath = path_1.default.resolve(process.cwd(), options.stats);
            if (!fs_1.default.existsSync(statsPath)) {
                logger_1.logger.error(`Arquivo de estatísticas não encontrado: ${statsPath}`);
                process.exit(1);
            }
            const outputPath = path_1.default.resolve(process.cwd(), options.output);
            logger_1.logger.info(`Analisando bundle a partir de: ${statsPath}`);
            const analyzer = new analyzer_1.BundleAnalyzer();
            await analyzer.analyzeBundleFromStats(statsPath);
            await analyzer.generateReport(outputPath);
            logger_1.logger.success('Análise concluída com sucesso');
        }
        catch (error) {
            logger_1.logger.error(`Falha na análise do bundle: ${error}`);
            process.exit(1);
        }
    });
}
//# sourceMappingURL=analyze-cli.js.map