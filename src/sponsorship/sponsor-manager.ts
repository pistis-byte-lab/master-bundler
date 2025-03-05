
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { execSync } from 'child_process';
import { Logger } from '../utils/logger';

const logger = new Logger('SponsorManager');

/**
 * Interface para níveis de patrocínio
 */
export interface SponsorTier {
  name: string;
  amount: number;
  benefits: string[];
}

/**
 * Interface para patrocinador em destaque
 */
export interface FeaturedSponsor {
  name: string;
  logo: string;
  url: string;
}

/**
 * Interface de configuração de patrocínio
 */
export interface SponsorConfig {
  name: string;
  description: string;
  links: {
    github?: string;
    openCollective?: string;
    patreon?: string;
    kofi?: string;
    buyMeACoffee?: string;
    custom?: string;
  };
  tiers: SponsorTier[];
  featuredSponsors?: FeaturedSponsor[];
  templatePath?: string;
  outputPath?: string;
}

/**
 * Interface para estatísticas de patrocínio
 */
export interface SponsorStats {
  totalSponsors: number;
  monthlyIncome: number;
  topTier: string;
  popularTier: string;
  history: {
    date: string;
    income: number;
    sponsors: number;
  }[];
}

/**
 * Classe que gerencia sistema de patrocínio
 */
export class SponsorManager {
  private config: SponsorConfig;
  private defaultTemplatePath: string;
  private defaultOutputPath: string;

  constructor(config?: Partial<SponsorConfig>) {
    this.defaultTemplatePath = path.resolve(__dirname, '../../templates/sponsor-page.html');
    this.defaultOutputPath = path.resolve(process.cwd(), './public/sponsor.html');

    this.config = {
      name: config?.name || 'TypeScript Bundler Project',
      description: config?.description || 'Support the development of this open source tool',
      links: config?.links || {},
      tiers: config?.tiers || [
        {
          name: 'Supporter',
          amount: 5,
          benefits: ['Name in README']
        },
        {
          name: 'Bronze Sponsor',
          amount: 25,
          benefits: ['Name in README', 'Access to private repo with beta features']
        },
        {
          name: 'Silver Sponsor',
          amount: 100,
          benefits: ['Logo in README', 'Priority support', 'Monthly consultation (30min)']
        },
        {
          name: 'Gold Sponsor',
          amount: 500,
          benefits: ['Large logo in README and docs', 'Priority support', 'Monthly consultation (2h)', 'Custom feature prioritization']
        }
      ],
      featuredSponsors: config?.featuredSponsors || [],
      templatePath: config?.templatePath || this.defaultTemplatePath,
      outputPath: config?.outputPath || this.defaultOutputPath
    };
  }

  /**
   * Configura o patrocínio interativamente
   */
  public async setupInteractive(): Promise<void> {
    logger.info('Iniciando configuração interativa de patrocínio...');
    // Em uma implementação real, aqui usaríamos uma biblioteca como inquirer
    // para coletar informações do usuário através do terminal

    logger.success('Configuração de patrocínio concluída!');
    logger.info(`Adicione um badge ao seu README: ![Patrocine este projeto](https://img.shields.io/badge/Patrocine-${encodeURIComponent(this.config.name)}-brightgreen)`);
  }

  /**
   * Gera a página de patrocínio HTML
   */
  public async generatePage(): Promise<string> {
    logger.info('Gerando página de patrocínio...');

    // Verifica se o template existe
    const templatePath = this.config.templatePath || this.defaultTemplatePath;
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template não encontrado: ${templatePath}`);
    }

    // Carrega o template
    let template = await fs.readFile(templatePath, 'utf-8');

    // Substitui variáveis no template
    template = template
      .replace(/{{PROJECT_NAME}}/g, this.config.name)
      .replace(/{{PROJECT_DESCRIPTION}}/g, this.config.description);

    // Adiciona links de patrocínio
    let linksHtml = '';
    if (this.config.links.github) {
      linksHtml += `<a href="${this.config.links.github}" class="sponsor-button github">GitHub Sponsors</a>`;
    }
    if (this.config.links.openCollective) {
      linksHtml += `<a href="${this.config.links.openCollective}" class="sponsor-button opencollective">Open Collective</a>`;
    }
    if (this.config.links.patreon) {
      linksHtml += `<a href="${this.config.links.patreon}" class="sponsor-button patreon">Patreon</a>`;
    }
    if (this.config.links.kofi) {
      linksHtml += `<a href="${this.config.links.kofi}" class="sponsor-button kofi">Ko-fi</a>`;
    }
    if (this.config.links.buyMeACoffee) {
      linksHtml += `<a href="${this.config.links.buyMeACoffee}" class="sponsor-button bmac">Buy Me A Coffee</a>`;
    }
    if (this.config.links.custom) {
      linksHtml += `<a href="${this.config.links.custom}" class="sponsor-button custom">Doar</a>`;
    }
    template = template.replace(/{{SPONSOR_LINKS}}/g, linksHtml);

    // Adiciona níveis de patrocínio
    let tiersHtml = '';
    for (const tier of this.config.tiers) {
      let benefitsHtml = '';
      for (const benefit of tier.benefits) {
        benefitsHtml += `<li>${benefit}</li>`;
      }
      
      tiersHtml += `
        <div class="sponsor-tier">
          <h3>${tier.name}</h3>
          <div class="tier-amount">$${tier.amount}/mês</div>
          <ul class="tier-benefits">
            ${benefitsHtml}
          </ul>
          <a href="${this.config.links.github || '#'}" class="tier-button">Tornar-se ${tier.name}</a>
        </div>
      `;
    }
    template = template.replace(/{{SPONSOR_TIERS}}/g, tiersHtml);

    // Adiciona patrocinadores em destaque
    let featuredHtml = '';
    if (this.config.featuredSponsors && this.config.featuredSponsors.length > 0) {
      for (const sponsor of this.config.featuredSponsors) {
        featuredHtml += `
          <a href="${sponsor.url}" class="featured-sponsor" target="_blank">
            <img src="${sponsor.logo}" alt="${sponsor.name}" title="${sponsor.name}">
          </a>
        `;
      }
    } else {
      featuredHtml = '<p>Seja o primeiro patrocinador em destaque!</p>';
    }
    template = template.replace(/{{FEATURED_SPONSORS}}/g, featuredHtml);

    // Salva o arquivo gerado
    const outputPath = this.config.outputPath || this.defaultOutputPath;
    await fs.ensureDir(path.dirname(outputPath));
    await fs.writeFile(outputPath, template, 'utf-8');

    logger.success(`Página de patrocínio gerada em: ${outputPath}`);
    return outputPath;
  }

  /**
   * Integração com GitHub Sponsors
   */
  public async setupGitHubSponsors(username: string): Promise<void> {
    logger.info(`Configurando integração com GitHub Sponsors para ${username}...`);
    
    // Verifica se o perfil existe
    try {
      const command = `curl -s https://github.com/${username}`;
      execSync(command);
    } catch (error) {
      logger.error(`Não foi possível encontrar o perfil GitHub: ${username}`);
      return;
    }

    // Atualiza o link no config
    this.config.links.github = `https://github.com/sponsors/${username}`;
    logger.success(`Integração com GitHub Sponsors configurada: ${this.config.links.github}`);
  }

  /**
   * Gera estatísticas de patrocínio (simuladas)
   */
  public getStats(): SponsorStats {
    // Em uma implementação real, isso buscaria dados de APIs reais
    return {
      totalSponsors: 42,
      monthlyIncome: 1250,
      topTier: 'Gold Sponsor',
      popularTier: 'Bronze Sponsor',
      history: [
        { date: '2023-01', income: 850, sponsors: 32 },
        { date: '2023-02', income: 900, sponsors: 35 },
        { date: '2023-03', income: 1050, sponsors: 38 },
        { date: '2023-04', income: 1250, sponsors: 42 },
      ]
    };
  }

  /**
   * Carrega configuração de arquivo
   */
  public loadConfig(configPath: string): void {
    try {
      const configData = fs.readJsonSync(configPath);
      this.config = {
        ...this.config,
        ...configData
      };
      logger.success(`Configuração de patrocínio carregada de ${configPath}`);
    } catch (error) {
      logger.error(`Erro ao carregar configuração: ${error}`);
    }
  }

  /**
   * Salva configuração em arquivo
   */
  public saveConfig(configPath: string): void {
    try {
      fs.writeJsonSync(configPath, this.config, { spaces: 2 });
      logger.success(`Configuração de patrocínio salva em ${configPath}`);
    } catch (error) {
      logger.error(`Erro ao salvar configuração: ${error}`);
    }
  }
}
