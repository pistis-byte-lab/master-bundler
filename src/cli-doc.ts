
#!/usr/bin/env node

import { DocGenerator } from './utils/doc-generator';
import { Command } from 'commander';
import { logger } from './utils/logger';

// Define o programa CLI
const program = new Command();

program
  .name('ts-bundler-doc')
  .description('Gerador de documentação para TypeScript Bundler')
  .version('1.0.0');

program
  .command('generate')
  .description('Gera documentação automática a partir dos comentários do código fonte')
  .option('-s, --source <dirs>', 'Diretórios de código fonte (separados por vírgula)', 'src')
  .option('-o, --output <dir>', 'Diretório de saída da documentação', 'docs/api')
  .option('-t, --types <extensions>', 'Extensões de arquivo a processar (separadas por vírgula)', '.ts,.tsx')
  .action(async (options) => {
    try {
      const sourceDirs = options.source.split(',');
      const fileTypes = options.types.split(',');
      
      logger.info(`Gerando documentação a partir de: ${sourceDirs.join(', ')}`);
      logger.info(`Arquivos de saída em: ${options.output}`);
      
      const generator = new DocGenerator(sourceDirs, options.output, fileTypes);
      await generator.generateDocs();
      
      logger.success('Documentação gerada com sucesso!');
    } catch (error) {
      logger.error(`Erro ao gerar documentação: ${error}`);
      process.exit(1);
    }
  });

program.parse(process.argv);
