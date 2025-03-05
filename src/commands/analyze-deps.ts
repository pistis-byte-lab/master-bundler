
import fs from 'fs';
import path from 'path';
import { bundle } from '../bundler';
import { logger } from '../utils/logger';
import { DependencyGraph } from '../utils/dependency-graph';
import { ModuleMetadata } from '../types';

interface AnalyzeOptions {
  input: string;
  format?: 'html' | 'dot' | 'json' | 'report';
  output?: string;
}

export async function analyzeDependencies(options: AnalyzeOptions): Promise<void> {
  try {
    logger.info('Analyzing dependencies...');
    
    // Perform a dry run bundle to collect module information
    const result = await bundle({
      input: options.input,
      dryRun: true,
      collectModuleInfo: true
    });
    
    if (!result || !result.modules) {
      logger.error('Failed to analyze dependencies: No modules found');
      return;
    }
    
    // Create dependency graph
    const modules = new Map<string, ModuleMetadata>();
    result.modules.forEach(module => {
      modules.set(module.id, module);
    });
    
    const graph = new DependencyGraph();
    modules.forEach((metadata, id) => {
      graph.addNode(id, metadata);
    });
    
    // Determine output path
    const defaultFilename = path.basename(options.input, path.extname(options.input));
    const outputPath = options.output || 
      (options.format === 'html' ? `${defaultFilename}-deps.html` :
       options.format === 'dot' ? `${defaultFilename}-deps.dot` :
       options.format === 'json' ? `${defaultFilename}-deps.json` :
       `${defaultFilename}-deps-report.md`);
    
    // Generate and save output based on format
    let content = '';
    switch (options.format || 'html') {
      case 'html':
        content = graph.getHTMLVisualization();
        break;
      case 'dot':
        content = graph.getDOT();
        break;
      case 'json':
        content = JSON.stringify(graph.getJSON(), null, 2);
        break;
      case 'report':
        content = graph.generateReport();
        break;
    }
    
    fs.writeFileSync(outputPath, content, 'utf8');
    logger.success(`Dependency analysis saved to ${outputPath}`);
    
    // Log some basic stats
    const totalModules = graph.nodes.size;
    const sourceModules = Array.from(graph.nodes.values()).filter(n => n.type === 'source').length;
    const externalModules = Array.from(graph.nodes.values()).filter(n => n.type === 'external').length;
    
    logger.info(`Analysis complete: ${totalModules} total modules (${sourceModules} source, ${externalModules} external)`);
    
  } catch (error) {
    logger.error('Failed to analyze dependencies:', error instanceof Error ? error.message : String(error));
  }
}
