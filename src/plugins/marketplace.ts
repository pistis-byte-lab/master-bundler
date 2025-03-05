
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { logger } from '../utils/logger';
import { Plugin } from './types';

export interface PluginMetadata {
  name: string;
  version: string;
  description: string;
  author: string;
  repository?: string;
  downloads?: number;
  rating?: number;
  tags?: string[];
}

export interface MarketplacePlugin extends PluginMetadata {
  id: string;
  installUrl: string;
  createdAt: string;
  updatedAt: string;
}

interface PluginRegistryResponse {
  plugins: MarketplacePlugin[];
  total: number;
}

export class PluginMarketplace {
  private registryUrl = 'https://registry.example.com/plugins';
  private cacheDir: string;
  private cacheTTL = 3600000; // 1 hour in milliseconds
  private registryCache: MarketplacePlugin[] | null = null;
  private registryCacheTime = 0;

  constructor(cacheDir?: string) {
    this.cacheDir = cacheDir || path.join(process.cwd(), '.marketplace-cache');
    this.ensureCacheDir();
  }

  private ensureCacheDir(): void {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
      logger.info(`Created plugin marketplace cache directory: ${this.cacheDir}`);
    }
  }

  // Busca plugins do registro remoto ou do cache
  async getPlugins(refresh = false): Promise<MarketplacePlugin[]> {
    if (this.registryCache && !refresh && Date.now() - this.registryCacheTime < this.cacheTTL) {
      logger.debug('Using cached plugin registry data');
      return this.registryCache;
    }

    try {
      logger.info('Fetching plugins from registry...');
      const response = await axios.get<PluginRegistryResponse>(this.registryUrl);
      this.registryCache = response.data.plugins;
      this.registryCacheTime = Date.now();
      return this.registryCache;
    } catch (error) {
      logger.error(`Failed to fetch plugins from registry: ${error instanceof Error ? error.message : String(error)}`);
      
      // Tenta usar cache mesmo expirado em caso de falha
      if (this.registryCache) {
        logger.warn('Using expired cache due to registry fetch failure');
        return this.registryCache;
      }
      
      return [];
    }
  }

  // Busca detalhes de um plugin específico
  async getPluginDetails(pluginId: string): Promise<MarketplacePlugin | null> {
    try {
      const response = await axios.get<MarketplacePlugin>(`${this.registryUrl}/${pluginId}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch plugin details for ${pluginId}: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  // Instala um plugin do marketplace
  async installPlugin(pluginId: string): Promise<boolean> {
    try {
      logger.info(`Installing plugin: ${pluginId}`);
      
      // Obtém detalhes do plugin
      const plugin = await this.getPluginDetails(pluginId);
      if (!plugin) {
        logger.error(`Plugin not found: ${pluginId}`);
        return false;
      }
      
      // Baixa o plugin
      const pluginDestPath = path.join(this.cacheDir, `${pluginId}.js`);
      const response = await axios.get<string>(plugin.installUrl, {
        responseType: 'text'
      });
      
      // Salva o arquivo do plugin
      fs.writeFileSync(pluginDestPath, response.data);
      logger.success(`Plugin ${pluginId} installed successfully to ${pluginDestPath}`);
      
      // Adiciona à configuração de plugins
      this.addPluginToConfig(pluginId, pluginDestPath);
      
      return true;
    } catch (error) {
      logger.error(`Failed to install plugin ${pluginId}: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  // Adiciona o plugin à configuração
  private addPluginToConfig(pluginId: string, pluginPath: string): void {
    const configPath = path.join(process.cwd(), 'bundler.config.json');
    let config: any = {};

    // Carrega configuração existente se disponível
    if (fs.existsSync(configPath)) {
      try {
        const configContent = fs.readFileSync(configPath, 'utf8');
        config = JSON.parse(configContent);
      } catch (error) {
        logger.warn(`Failed to read existing config: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // Adiciona o plugin à lista de plugins
    if (!config.plugins) {
      config.plugins = [];
    }
    
    if (!config.plugins.includes(pluginPath)) {
      config.plugins.push(pluginPath);
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      logger.info(`Added plugin ${pluginId} to bundler configuration`);
    }
  }

  // Desinstala um plugin
  async uninstallPlugin(pluginId: string): Promise<boolean> {
    try {
      const pluginPath = path.join(this.cacheDir, `${pluginId}.js`);
      
      if (fs.existsSync(pluginPath)) {
        fs.unlinkSync(pluginPath);
        logger.info(`Removed plugin file: ${pluginPath}`);
        
        // Remove da configuração
        this.removePluginFromConfig(pluginPath);
        return true;
      } else {
        logger.warn(`Plugin file not found: ${pluginPath}`);
        return false;
      }
    } catch (error) {
      logger.error(`Failed to uninstall plugin ${pluginId}: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  // Remove o plugin da configuração
  private removePluginFromConfig(pluginPath: string): void {
    const configPath = path.join(process.cwd(), 'bundler.config.json');
    
    if (fs.existsSync(configPath)) {
      try {
        const configContent = fs.readFileSync(configPath, 'utf8');
        const config = JSON.parse(configContent);
        
        if (config.plugins && Array.isArray(config.plugins)) {
          config.plugins = config.plugins.filter((p: string) => p !== pluginPath);
          fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
          logger.info(`Removed plugin from bundler configuration`);
        }
      } catch (error) {
        logger.error(`Failed to update config file: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  // Atualiza um plugin instalado
  async updatePlugin(pluginId: string): Promise<boolean> {
    logger.info(`Updating plugin: ${pluginId}`);
    
    // Desinstala e reinstala para atualizar
    await this.uninstallPlugin(pluginId);
    return await this.installPlugin(pluginId);
  }

  // Lista plugins instalados
  listInstalledPlugins(): PluginMetadata[] {
    const installedPlugins: PluginMetadata[] = [];
    
    try {
      const files = fs.readdirSync(this.cacheDir);
      
      for (const file of files) {
        if (file.endsWith('.js')) {
          const pluginId = file.replace('.js', '');
          const pluginPath = path.join(this.cacheDir, file);
          
          try {
            // Carrega o plugin para obter metadados
            const plugin = require(pluginPath);
            
            if (plugin.metadata) {
              installedPlugins.push({
                ...plugin.metadata,
                id: pluginId
              });
            } else {
              logger.warn(`Plugin ${pluginId} does not have metadata`);
            }
          } catch (error) {
            logger.error(`Failed to load plugin ${pluginId}: ${error instanceof Error ? error.message : String(error)}`);
          }
        }
      }
      
      return installedPlugins;
    } catch (error) {
      logger.error(`Failed to list installed plugins: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }
}

// Exporta uma instância singleton do marketplace
export const pluginMarketplace = new PluginMarketplace();
