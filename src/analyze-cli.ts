
import { Command } from 'commander';
import path from 'path';
import fs from 'fs';
import { BundleAnalyzer } from './utils/analyzer';
import { logger } from './utils/logger';

export function registerAnalyzeCommands(program: Command): void {
  program
    .command('analyze')
    .description('Analisa um bundle e gera relatório de tamanho e composição')
    .option('-s, --stats <path>', 'Caminho para o arquivo de estatísticas do bundle')
    .option('-o, --output <path>', 'Caminho para o arquivo de saída do relatório', 'bundle-analysis.json')
    .action(async (options) => {
      try {
        if (!options.stats) {
          logger.error('É necessário fornecer um arquivo de estatísticas do bundle (--stats)');
          process.exit(1);
        }
        
        const statsPath = path.resolve(process.cwd(), options.stats);
        if (!fs.existsSync(statsPath)) {
          logger.error(`Arquivo de estatísticas não encontrado: ${statsPath}`);
          process.exit(1);
        }
        
        const outputPath = path.resolve(process.cwd(), options.output);
        
        logger.info(`Analisando bundle a partir de: ${statsPath}`);
        
        const analyzer = new BundleAnalyzer();
        await analyzer.analyzeBundleFromStats(statsPath);
        await analyzer.generateReport(outputPath);
        
        logger.success('Análise concluída com sucesso');
      } catch (error) {
        logger.error(`Falha na análise do bundle: ${error}`);
        process.exit(1);
      }
    });
}
