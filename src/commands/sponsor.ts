
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { Command } from 'commander';
import { SponsorManager } from '../sponsorship/sponsor-manager';
import { Logger } from '../utils/logger';

const logger = new Logger('Sponsor');

/**
 * Configura os comandos de patrocínio
 */
export function setupSponsorCommands(program: Command): void {
  const sponsorCommand = program
    .command('sponsor')
    .description('Gerencia configurações de patrocínio para o projeto');

  // Comando para configuração interativa
  sponsorCommand
    .command('setup')
    .description('Configura patrocínio interativamente')
    .action(async () => {
      try {
        const manager = new SponsorManager();
        await manager.setupInteractive();
        // Salva a configuração no diretório do projeto
        manager.saveConfig(path.resolve(process.cwd(), './sponsor-config.json'));
      } catch (error) {
        logger.error(`Erro na configuração de patrocínio: ${error}`);
        process.exit(1);
      }
    });

  // Comando para gerar página de patrocínio
  sponsorCommand
    .command('generate')
    .description('Gera uma página HTML de patrocínio')
    .option('-c, --config <path>', 'Caminho para arquivo de configuração')
    .option('-o, --output <path>', 'Caminho para salvar a página gerada')
    .action(async (options) => {
      try {
        const manager = new SponsorManager();
        
        // Carrega configuração se especificada
        if (options.config) {
          const configPath = path.resolve(process.cwd(), options.config);
          if (fs.existsSync(configPath)) {
            manager.loadConfig(configPath);
          } else {
            logger.error(`Arquivo de configuração não encontrado: ${configPath}`);
            process.exit(1);
          }
        }
        
        // Define caminho de saída personalizado se especificado
        const outputPath = options.output 
          ? path.resolve(process.cwd(), options.output)
          : undefined;
          
        // Gera a página
        const generatedPath = await manager.generatePage();
        logger.success(`Página de patrocínio gerada com sucesso em: ${generatedPath}`);
      } catch (error) {
        logger.error(`Erro ao gerar página de patrocínio: ${error}`);
        process.exit(1);
      }
    });

  // Comando para integração com GitHub Sponsors
  sponsorCommand
    .command('github')
    .description('Configura integração com GitHub Sponsors')
    .argument('<username>', 'Nome de usuário do GitHub')
    .option('-c, --config <path>', 'Caminho para arquivo de configuração')
    .action(async (username, options) => {
      try {
        const manager = new SponsorManager();
        
        // Carrega configuração se especificada
        if (options.config) {
          const configPath = path.resolve(process.cwd(), options.config);
          if (fs.existsSync(configPath)) {
            manager.loadConfig(configPath);
          }
        }
        
        await manager.setupGitHubSponsors(username);
        
        // Salva configuração atualizada
        const configPath = options.config || path.resolve(process.cwd(), './sponsor-config.json');
        manager.saveConfig(configPath);
        
        logger.success(`Integração com GitHub Sponsors configurada para ${username}`);
      } catch (error) {
        logger.error(`Erro na configuração do GitHub Sponsors: ${error}`);
        process.exit(1);
      }
    });

  // Comando para exibir estatísticas
  sponsorCommand
    .command('stats')
    .description('Mostra estatísticas de patrocínio')
    .option('-c, --config <path>', 'Caminho para arquivo de configuração')
    .action(async (options) => {
      try {
        const manager = new SponsorManager();
        
        // Carrega configuração se especificada
        if (options.config) {
          const configPath = path.resolve(process.cwd(), options.config);
          if (fs.existsSync(configPath)) {
            manager.loadConfig(configPath);
          }
        }
        
        const stats = manager.getStats();
        
        console.log('\n');
        console.log(chalk.cyan.bold('=== Estatísticas de Patrocínio ==='));
        console.log(chalk.white(`Total de patrocinadores: ${chalk.green(stats.totalSponsors)}`));
        console.log(chalk.white(`Receita mensal: ${chalk.green('$' + stats.monthlyIncome)}`));
        console.log(chalk.white(`Nível mais alto atual: ${chalk.green(stats.topTier)}`));
        console.log(chalk.white(`Nível mais popular: ${chalk.green(stats.popularTier)}`));
        
        console.log('\n');
        console.log(chalk.cyan.bold('=== Histórico ==='));
        
        for (const entry of stats.history) {
          console.log(chalk.white(`${entry.date}: ${chalk.green('$' + entry.income)} de ${chalk.green(entry.sponsors)} patrocinadores`));
        }
        console.log('\n');
        
      } catch (error) {
        logger.error(`Erro ao obter estatísticas: ${error}`);
        process.exit(1);
      }
    });

  return sponsorCommand;
}
