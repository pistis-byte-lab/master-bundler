
import * as fs from 'fs';
import * as path from 'path';
import { Command } from 'commander';
import { groqService } from '../ai/groq-integration';
import { logger } from '../utils/logger';
import { loadConfig } from '../config';
import { Analyzer } from '../analyzer';

export function registerAIOptimizeCommand(program: Command): void {
  program
    .command('ai-optimize')
    .description('Usa IA para otimizar a configuração do bundle e sugerir melhorias')
    .option('-c, --config <path>', 'Caminho para o arquivo de configuração', './masterbundler.config.ts')
    .option('-k, --api-key <key>', 'API key do Groq (alternativa a definir GROQ_API_KEY)')
    .option('-a, --analyze', 'Analisa o bundle atual e sugere otimizações', false)
    .option('-g, --generate-config', 'Gera uma configuração otimizada', false)
    .option('-f, --file <path>', 'Arquivo a ser analisado para otimizações')
    .action(async (options) => {
      try {
        // Configura API key
        if (options.apiKey) {
          groqService.setApiKey(options.apiKey);
        }

        if (!groqService.isConfigured()) {
          logger.warn('API Groq não configurada. Configure GROQ_API_KEY no ambiente ou use --api-key');
          logger.info('Exemplo: GROQ_API_KEY=sua-chave-aqui npx tsx src/cli.ts ai-optimize');
          return;
        }

        // Carrega configuração atual
        const config = await loadConfig(options.config);

        // Se solicitado, analisa um arquivo específico
        if (options.file) {
          if (!fs.existsSync(options.file)) {
            logger.error(`Arquivo não encontrado: ${options.file}`);
            return;
          }

          const code = fs.readFileSync(options.file, 'utf-8');
          logger.info(`Analisando ${options.file} com IA...`);
          
          const analysis = await groqService.analyzeCode(code);
          logger.info('Análise de IA:');
          console.log('\n' + analysis + '\n');
        }

        // Se solicitado, analisa o bundle
        if (options.analyze) {
          logger.info('Analisando bundle atual...');
          
          // Usa o analisador para obter estatísticas
          const analyzer = new Analyzer();
          const stats = analyzer.getStats();
          
          // Coleta amostras de código (até 5 arquivos)
          const sampleCode: string[] = [];
          if (config.input) {
            let inputFiles: string[] = [];
            
            if (typeof config.input === 'string') {
              inputFiles = [config.input];
            } else if (Array.isArray(config.input)) {
              inputFiles = config.input;
            } else {
              inputFiles = Object.values(config.input);
            }
            
            // Limita a 5 arquivos para não sobrecarregar o contexto
            for (let i = 0; i < Math.min(5, inputFiles.length); i++) {
              if (fs.existsSync(inputFiles[i])) {
                sampleCode.push(fs.readFileSync(inputFiles[i], 'utf-8'));
              }
            }
          }
          
          logger.info('Obtendo sugestões de otimização...');
          const optimizations = await groqService.suggestBundleOptimizations(stats, sampleCode);
          
          logger.info('Sugestões de otimização de IA:');
          console.log('\n' + optimizations + '\n');
        }

        // Se solicitado, gera uma configuração otimizada
        if (options.generateConfig) {
          logger.info('Gerando configuração otimizada...');
          
          // Coleta informações sobre a estrutura do projeto
          const projectStructure = {
            // Simplificado para o exemplo
            entryPoints: config.input,
            dependencies: require(path.resolve('./package.json')).dependencies || {},
            hasTypeScript: fs.existsSync('./tsconfig.json'),
            hasReact: fs.existsSync('./node_modules/react'),
            hasVue: fs.existsSync('./node_modules/vue')
          };
          
          const optimizedConfig = await groqService.generateOptimizedConfig(config, projectStructure);
          
          logger.info('Configuração otimizada gerada:');
          console.log('\n' + optimizedConfig + '\n');
          
          // Pergunta se deseja salvar
          // Na versão real, aqui seria usado um prompt interativo
          logger.info('Para salvar esta configuração, copie o código acima para um novo arquivo de configuração');
        }

        logger.success('Processo de otimização com IA concluído!');
      } catch (error) {
        logger.error(`Erro no comando de otimização com IA: ${error.message}`);
      }
    });
}
