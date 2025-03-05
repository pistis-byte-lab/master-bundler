
import { Command } from 'commander';
import { pluginMarketplace } from '../plugins/marketplace';
import { logger } from '../utils/logger';
import Table from 'cli-table3';

export function registerMarketplaceCommands(program: Command): void {
  const marketplace = program
    .command('marketplace')
    .description('Plugin marketplace commands');

  marketplace
    .command('list')
    .description('List available plugins from marketplace')
    .option('-r, --refresh', 'Refresh plugin cache')
    .action(async (options) => {
      try {
        logger.info('Fetching plugins from marketplace...');
        const plugins = await pluginMarketplace.getPlugins(options.refresh);
        
        if (plugins.length === 0) {
          logger.info('No plugins found in marketplace');
          return;
        }

        const table = new Table({
          head: ['ID', 'Name', 'Version', 'Description', 'Author'],
          colWidths: [15, 20, 10, 40, 15]
        });

        plugins.forEach(plugin => {
          table.push([
            plugin.id,
            plugin.name,
            plugin.version,
            plugin.description.length > 37 ? plugin.description.substring(0, 37) + '...' : plugin.description,
            plugin.author
          ]);
        });

        console.log(table.toString());
        logger.info(`Found ${plugins.length} plugins`);
      } catch (error) {
        logger.error(`Failed to list plugins: ${error instanceof Error ? error.message : String(error)}`);
      }
    });

  marketplace
    .command('install <pluginId>')
    .description('Install a plugin from marketplace')
    .action(async (pluginId) => {
      try {
        logger.info(`Installing plugin: ${pluginId}`);
        const success = await pluginMarketplace.installPlugin(pluginId);
        
        if (success) {
          logger.success(`Plugin ${pluginId} installed successfully`);
        } else {
          logger.error(`Failed to install plugin ${pluginId}`);
        }
      } catch (error) {
        logger.error(`Failed to install plugin: ${error instanceof Error ? error.message : String(error)}`);
      }
    });

  marketplace
    .command('uninstall <pluginId>')
    .description('Uninstall a plugin')
    .action(async (pluginId) => {
      try {
        logger.info(`Uninstalling plugin: ${pluginId}`);
        const success = await pluginMarketplace.uninstallPlugin(pluginId);
        
        if (success) {
          logger.success(`Plugin ${pluginId} uninstalled successfully`);
        } else {
          logger.error(`Failed to uninstall plugin ${pluginId}`);
        }
      } catch (error) {
        logger.error(`Failed to uninstall plugin: ${error instanceof Error ? error.message : String(error)}`);
      }
    });

  marketplace
    .command('update <pluginId>')
    .description('Update a plugin')
    .action(async (pluginId) => {
      try {
        logger.info(`Updating plugin: ${pluginId}`);
        const success = await pluginMarketplace.updatePlugin(pluginId);
        
        if (success) {
          logger.success(`Plugin ${pluginId} updated successfully`);
        } else {
          logger.error(`Failed to update plugin ${pluginId}`);
        }
      } catch (error) {
        logger.error(`Failed to update plugin: ${error instanceof Error ? error.message : String(error)}`);
      }
    });

  marketplace
    .command('installed')
    .description('List installed plugins')
    .action(() => {
      try {
        const plugins = pluginMarketplace.listInstalledPlugins();
        
        if (plugins.length === 0) {
          logger.info('No plugins installed');
          return;
        }

        const table = new Table({
          head: ['Name', 'Version', 'Description', 'Author'],
          colWidths: [20, 10, 40, 15]
        });

        plugins.forEach(plugin => {
          table.push([
            plugin.name,
            plugin.version,
            plugin.description.length > 37 ? plugin.description.substring(0, 37) + '...' : plugin.description,
            plugin.author
          ]);
        });

        console.log(table.toString());
        logger.info(`${plugins.length} plugins installed`);
      } catch (error) {
        logger.error(`Failed to list installed plugins: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
}
