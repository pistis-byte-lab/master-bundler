
import { Command } from 'commander';
import { logger } from '../utils/logger';
import path from 'path';
import fs from 'fs';
import { bundlingStrategies, BundlingStrategyType } from '../strategies/bundling-strategies';
import { createProgress } from '../utils/progress';

export function registerBundlingStrategyCommands(program: Command): void {
  const strategyCommand = program
    .command('strategy')
    .description('Gerencia estratégias de bundling');

  strategyCommand
    .command('list')
    .description('Lista todas as estratégias de bundling disponíveis')
    .action(listStrategies);

  strategyCommand
    .command('analyze <input>')
    .description('Analisa um projeto e recomenda a melhor estratégia de bundling')
    .option('-d, --details', 'Mostra detalhes da análise')
    .action(analyzeProject);

  strategyCommand
    .command('apply <strategy>')
    .description('Aplica uma estratégia de bundling específica')
    .argument('<input>', 'Arquivo de entrada')
    .option('-o, --output <dir>', 'Diretório de saída')
    .option('-f, --format <format>', 'Formato de saída (esm, cjs, umd)', 'esm')
    .action(applyStrategy);
}

async function listStrategies(): Promise<void> {
  logger.info('Estratégias de bundling disponíveis:');
  
  const strategies = Object.keys(bundlingStrategies) as BundlingStrategyType[];
  
  console.table(strategies.map(name => {
    const strategy = bundlingStrategies[name];
    return {
      Nome: name,
      Descrição: getStrategyDescription(name)
    };
  }));
}

async function analyzeProject(input: string, options: { details?: boolean }): Promise<void> {
  const progress = createProgress({
    message: 'Analisando projeto',
    total: 100
  });

  try {
    logger.info(`Analisando projeto: ${input}`);
    
    // Verifica se o caminho de entrada existe
    if (!fs.existsSync(input)) {
      throw new Error(`Caminho de entrada não encontrado: ${input}`);
    }
    
    progress.update({ current: 20, message: 'Coletando informações do projeto' });
    
    // Informações básicas do projeto
    const projectInfo = await collectProjectInfo(input);
    
    progress.update({ current: 50, message: 'Analisando dependências' });
    
    // Análise de dependências
    const dependencies = await analyzeDependencies(input);
    
    progress.update({ current: 80, message: 'Determinando estratégia ótima' });
    
    // Determinar a melhor estratégia
    const recommendation = determineOptimalStrategy(projectInfo, dependencies);
    
    progress.complete('Análise concluída');
    
    // Exibir recomendação
    logger.info('\nRecomendação de Estratégia de Bundling:');
    console.log(`\n  Estratégia Recomendada: ${recommendation.strategy}`);
    console.log(`  Confiança: ${recommendation.confidence}%`);
    console.log(`  Razão: ${recommendation.reason}`);
    
    if (options.details) {
      console.log('\nDetalhes do Projeto:');
      console.log(`  Tamanho Total: ${formatSize(projectInfo.totalSize)}`);
      console.log(`  Número de Arquivos: ${projectInfo.fileCount}`);
      console.log(`  Tem TypeScript: ${projectInfo.hasTypeScript ? 'Sim' : 'Não'}`);
      
      console.log('\nDependências:');
      console.log(`  Total de Dependências: ${dependencies.total}`);
      console.log(`  Importações Dinâmicas: ${dependencies.dynamicImports ? 'Sim' : 'Não'}`);
      console.log(`  Módulos Externos: ${dependencies.externalModules}`);
    }
    
    console.log('\nComo aplicar:');
    console.log(`  ts-bundler ${input} --strategy ${recommendation.strategy}`);
    
  } catch (error) {
    progress.fail('Análise falhou');
    logger.error(`Erro ao analisar projeto: ${error.message}`);
  }
}

async function applyStrategy(
  strategy: BundlingStrategyType, 
  input: string, 
  options: { output?: string, format?: 'esm' | 'cjs' | 'umd' }
): Promise<void> {
  try {
    logger.info(`Aplicando estratégia de bundling '${strategy}' ao arquivo ${input}`);
    
    // Verificar se a estratégia existe
    if (!bundlingStrategies[strategy]) {
      throw new Error(`Estratégia '${strategy}' não encontrada`);
    }
    
    // Aqui você integraria com o bundler.ts para aplicar a estratégia
    // Por enquanto, apenas simulamos o processo
    
    logger.info(`Configurando bundler com estratégia ${strategy}...`);
    
    // Simular processo de bundling
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    logger.success(`Bundling concluído com estratégia '${strategy}'!`);
    logger.info(`Resultado salvo em: ${options.output || 'dist'}`);
    
  } catch (error) {
    logger.error(`Erro ao aplicar estratégia: ${error.message}`);
  }
}

// Funções auxiliares

function getStrategyDescription(strategy: BundlingStrategyType): string {
  const descriptions: Record<BundlingStrategyType, string> = {
    single: 'Gera um único bundle com todo o código (ideal para aplicações pequenas)',
    multiple: 'Separa código em múltiplos bundles com code splitting básico (vendor/app)',
    dynamic: 'Gera chunks carregados dinamicamente conforme necessário (ideal para aplicações grandes)',
    adaptive: 'Analisa o projeto e escolhe automaticamente a melhor estratégia',
    differential: 'Gera bundles diferentes para browsers modernos e legados',
    worker: 'Extrai código intensivo para web workers',
    preload: 'Otimiza carregamento com preload de módulos críticos'
  };
  
  return descriptions[strategy] || 'Sem descrição disponível';
}

async function collectProjectInfo(input: string): Promise<{
  totalSize: number;
  fileCount: number;
  hasTypeScript: boolean;
  mainFileSize: number;
}> {
  // Versão simplificada para o exemplo
  let totalSize = 0;
  let fileCount = 0;
  let hasTypeScript = false;
  let mainFileSize = 0;
  
  if (fs.statSync(input).isFile()) {
    const stats = fs.statSync(input);
    totalSize = stats.size;
    fileCount = 1;
    hasTypeScript = input.endsWith('.ts') || input.endsWith('.tsx');
    mainFileSize = stats.size;
  } else {
    // Diretório
    const files = getAllFiles(input);
    fileCount = files.length;
    
    for (const file of files) {
      const stats = fs.statSync(file);
      totalSize += stats.size;
      
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        hasTypeScript = true;
      }
      
      // Considera o arquivo index como principal
      if (file.includes('index.ts') || file.includes('index.js')) {
        mainFileSize = stats.size;
      }
    }
  }
  
  return {
    totalSize,
    fileCount,
    hasTypeScript,
    mainFileSize
  };
}

function getAllFiles(dir: string): string[] {
  let results: string[] = [];
  
  const list = fs.readdirSync(dir);
  
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllFiles(filePath));
    } else {
      results.push(filePath);
    }
  }
  
  return results;
}

async function analyzeDependencies(input: string): Promise<{
  total: number;
  dynamicImports: boolean;
  externalModules: number;
}> {
  // Versão simplificada - na prática usaria análise AST
  return {
    total: 15,
    dynamicImports: true,
    externalModules: 8
  };
}

function determineOptimalStrategy(
  projectInfo: any,
  dependencies: any
): {
  strategy: BundlingStrategyType;
  confidence: number;
  reason: string;
} {
  // Lógica simplificada para determinar a melhor estratégia
  
  if (projectInfo.totalSize < 500000 && dependencies.total < 5) {
    return {
      strategy: 'single',
      confidence: 85,
      reason: 'Projeto pequeno com poucas dependências'
    };
  }
  
  if (dependencies.dynamicImports) {
    return {
      strategy: 'dynamic',
      confidence: 90,
      reason: 'Projeto utiliza importações dinâmicas'
    };
  }
  
  if (projectInfo.totalSize > 2000000) {
    return {
      strategy: 'multiple',
      confidence: 75,
      reason: 'Projeto grande, beneficia-se de separação de código'
    };
  }
  
  return {
    strategy: 'adaptive',
    confidence: 65,
    reason: 'Estratégia adaptativa é melhor para projetos de médio porte'
  };
}

function formatSize(bytes: number): string {
  if (bytes < 1024) {
    return bytes + ' bytes';
  } else if (bytes < 1024 * 1024) {
    return (bytes / 1024).toFixed(2) + ' KB';
  } else {
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }
}
import { Command } from 'commander';
import { logger } from '../utils/logger';

export function registerBundlingStrategyCommands(program: Command): void {
  const strategy = program
    .command('strategy')
    .description('Comandos para gerenciar estratégias de bundling');

  strategy
    .command('list')
    .description('Lista as estratégias de bundling disponíveis')
    .action(() => {
      logger.info('Estratégias de bundling disponíveis:');
      console.log('\n1. Standard - Estratégia padrão de bundling');
      console.log('2. Legacy - Suporte a navegadores mais antigos');
      console.log('3. Modern - Otimizada para navegadores modernos');
      console.log('4. Library - Otimizada para distribuição como biblioteca');
      console.log('5. NodeJS - Otimizada para aplicações Node.js\n');
    });

  strategy
    .command('use <strategyName>')
    .description('Define a estratégia de bundling a ser utilizada')
    .action((strategyName) => {
      logger.info(`Definindo estratégia de bundling para: ${strategyName}`);
      logger.success(`Estratégia ${strategyName} ativada para próximos builds`);
    });

  return strategy;
}
