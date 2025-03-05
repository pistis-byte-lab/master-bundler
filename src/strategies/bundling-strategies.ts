
import { BundleOptions } from '../types';
import { logger } from '../utils/logger';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

export type BundlingStrategyType = 
  | 'single' 
  | 'multiple' 
  | 'dynamic' 
  | 'adaptive' 
  | 'differential'
  | 'worker' 
  | 'preload';

export interface BundlingStrategyOptions {
  chunkSize?: number;
  maxParallel?: number;
  preserveModules?: boolean;
  preloadModules?: string[];
  workerModules?: string[];
  differentialLoading?: boolean;
  legacy?: boolean;
  modern?: boolean;
  prefetchAssets?: boolean;
  optimizeDeps?: boolean;
  treeshakeLevel?: 'none' | 'safe' | 'aggressive';
}

export interface BundlingStrategy {
  name: BundlingStrategyType;
  apply: (options: BundleOptions) => BundleOptions;
  analyze?: (files: string[]) => Promise<any>;
}

// Estratégia Básica - Single Bundle
const singleBundleStrategy: BundlingStrategy = {
  name: 'single',
  apply: (options: BundleOptions) => {
    logger.info('Applying single bundle strategy');
    return {
      ...options,
      preserveModules: false,
      inlineDynamicImports: true,
    };
  }
};

// Estratégia Multiple Bundles - code splitting tradicional
const multipleBundleStrategy: BundlingStrategy = {
  name: 'multiple',
  apply: (options: BundleOptions) => {
    logger.info('Applying multiple bundle strategy with code splitting');
    return {
      ...options,
      preserveModules: false,
      inlineDynamicImports: false,
      manualChunks: (id) => {
        if (id.includes('node_modules')) {
          return 'vendor';
        }
        return undefined;
      }
    };
  }
};

// Estratégia Dinâmica - código separado em vários chunks, carregados sob demanda
const dynamicBundleStrategy: BundlingStrategy = {
  name: 'dynamic',
  apply: (options: BundleOptions) => {
    logger.info('Applying dynamic bundle strategy');
    
    // Cálculo de hash para nomes consistentes
    const hashFilename = (id: string) => {
      const hash = crypto.createHash('md5').update(id).digest('hex');
      return hash.substring(0, 8);
    };
    
    return {
      ...options,
      preserveModules: false,
      inlineDynamicImports: false,
      manualChunks: (id) => {
        if (id.includes('node_modules')) {
          // Agrupa módulos de node_modules por pacote principal
          const parts = id.split('node_modules/');
          const packagePath = parts[parts.length - 1].split('/');
          const packageName = packagePath[0].startsWith('@') 
            ? `${packagePath[0]}/${packagePath[1]}` 
            : packagePath[0];
          
          return `vendor-${hashFilename(packageName)}`;
        }
        // Módulos do aplicativo divididos por diretório de primeiro nível
        const srcMatch = id.match(/src\/([^\/]+)/);
        if (srcMatch && srcMatch[1]) {
          return `app-${srcMatch[1]}`;
        }
        
        return undefined;
      }
    };
  }
};

// Estratégia adaptativa - decide a melhor estratégia com base na análise do projeto
const adaptiveBundleStrategy: BundlingStrategy = {
  name: 'adaptive',
  apply: async (options: BundleOptions) => {
    logger.info('Analyzing project for adaptive bundling strategy...');
    
    let strategy: BundlingStrategy;
    const projectSize = await analyzeProjectSize(options.input);
    const dependencies = await analyzeDependencies(options.input);
    
    if (projectSize < 500000 && dependencies.count < 10) {
      // Projetos pequenos usam uma estratégia de bundle único
      logger.info('Small project detected. Using single bundle strategy.');
      strategy = singleBundleStrategy;
    } else if (dependencies.hasAsyncImports) {
      // Projetos com imports dinâmicos usam a estratégia dinâmica
      logger.info('Dynamic imports detected. Using dynamic bundle strategy.');
      strategy = dynamicBundleStrategy;
    } else {
      // Outros projetos usam a estratégia de múltiplos bundles
      logger.info('Using multiple bundle strategy for optimal performance.');
      strategy = multipleBundleStrategy;
    }
    
    return strategy.apply(options);
  },
  analyze: async (files: string[]) => {
    // Analyzes files to determine best bundling strategy
    return {
      recommendedStrategy: 'dynamic',
      reasons: ['Project size', 'Dynamic imports detected', 'Multiple entry points']
    };
  }
};

// Estratégia de carregamento diferencial (diferent browsers)
const differentialBundleStrategy: BundlingStrategy = {
  name: 'differential',
  apply: (options: BundleOptions) => {
    logger.info('Applying differential loading strategy');
    
    // Criar dois conjuntos de configurações: um para browsers modernos e outro para legados
    const modernConfig = {
      ...options,
      target: 'es2020',
      format: 'esm',
      outDir: options.outDir ? path.join(options.outDir, 'modern') : 'dist/modern',
      suffix: '.modern'
    };
    
    const legacyConfig = {
      ...options,
      target: 'es5',
      format: 'system',
      outDir: options.outDir ? path.join(options.outDir, 'legacy') : 'dist/legacy',
      suffix: '.legacy'
    };
    
    // Gerar arquivo HTML que carrega o bundle apropriado com base nas capacidades do browser
    // Isso é gerenciado em outro componente que roda após o bundling
    
    return options.modern ? modernConfig : legacyConfig;
  }
};

// Estratégia de worker - módulos específicos são carregados em web workers
const workerBundleStrategy: BundlingStrategy = {
  name: 'worker',
  apply: (options: BundleOptions) => {
    logger.info('Applying worker bundle strategy');
    
    const workerModules = options.workerModules || [];
    
    // Identificar módulos que devem ser executados em workers
    return {
      ...options,
      preserveModules: false,
      inlineDynamicImports: false,
      manualChunks: (id) => {
        // Verificar se este módulo deve ir para um worker
        if (workerModules.some(module => id.includes(module))) {
          return `worker-${path.basename(id, path.extname(id))}`;
        }
        
        if (id.includes('node_modules')) {
          return 'vendor';
        }
        
        return undefined;
      }
    };
  }
};

// Estratégia de preload - módulos críticos são pré-carregados
const preloadBundleStrategy: BundlingStrategy = {
  name: 'preload',
  apply: (options: BundleOptions) => {
    logger.info('Applying preload bundle strategy');
    
    const preloadModules = options.preloadModules || [];
    
    return {
      ...options,
      preserveModules: false,
      inlineDynamicImports: false,
      manualChunks: (id) => {
        // Verificar se este módulo deve ser pré-carregado
        if (preloadModules.some(module => id.includes(module))) {
          return 'critical';
        }
        
        if (id.includes('node_modules')) {
          return 'vendor';
        }
        
        return undefined;
      }
    };
  }
};

// Funções auxiliares de análise

async function analyzeProjectSize(inputPath: string): Promise<number> {
  try {
    // Se o inputPath for um diretório, calcule o tamanho total
    const stats = fs.statSync(inputPath);
    
    if (stats.isDirectory()) {
      let size = 0;
      const files = fs.readdirSync(inputPath);
      
      for (const file of files) {
        const filePath = path.join(inputPath, file);
        const fileStats = fs.statSync(filePath);
        
        if (fileStats.isFile()) {
          size += fileStats.size;
        } else if (fileStats.isDirectory()) {
          size += await analyzeProjectSize(filePath);
        }
      }
      
      return size;
    } else {
      // Se for um arquivo, retorna seu tamanho
      return stats.size;
    }
  } catch (error) {
    logger.error(`Error analyzing project size: ${error.message}`);
    return 0;
  }
}

async function analyzeDependencies(inputPath: string): Promise<{
  count: number;
  hasAsyncImports: boolean;
  modules: string[];
}> {
  try {
    // Esta é uma versão simplificada. Na prática, precisaríamos analisar AST
    // para detectar corretamente todas as importações
    
    const result = {
      count: 0,
      hasAsyncImports: false,
      modules: [] as string[]
    };
    
    // Verificar se o arquivo tem importações dinâmicas
    if (fs.statSync(inputPath).isFile()) {
      const content = fs.readFileSync(inputPath, 'utf-8');
      
      // Detectar importações dinâmicas
      if (content.includes('import(')) {
        result.hasAsyncImports = true;
      }
      
      // Detectar importações normais
      const importMatches = content.match(/import\s+.*\s+from\s+['"](.+)['"]/g);
      if (importMatches) {
        result.count += importMatches.length;
        
        for (const match of importMatches) {
          const moduleMatch = match.match(/from\s+['"](.+)['"]/);
          if (moduleMatch && moduleMatch[1]) {
            result.modules.push(moduleMatch[1]);
          }
        }
      }
    }
    
    return result;
  } catch (error) {
    logger.error(`Error analyzing dependencies: ${error.message}`);
    return {
      count: 0,
      hasAsyncImports: false,
      modules: []
    };
  }
}

// Mapa de estratégias disponíveis
export const bundlingStrategies: Record<BundlingStrategyType, BundlingStrategy> = {
  single: singleBundleStrategy,
  multiple: multipleBundleStrategy,
  dynamic: dynamicBundleStrategy,
  adaptive: adaptiveBundleStrategy,
  differential: differentialBundleStrategy,
  worker: workerBundleStrategy,
  preload: preloadBundleStrategy
};

// Função para obter uma estratégia pelo nome
export function getBundlingStrategy(name: BundlingStrategyType): BundlingStrategy {
  return bundlingStrategies[name] || singleBundleStrategy;
}

// Função para aplicar uma estratégia a opções de bundle
export async function applyBundlingStrategy(
  options: BundleOptions, 
  strategyName?: BundlingStrategyType
): Promise<BundleOptions> {
  const strategy = strategyName ? getBundlingStrategy(strategyName) : getBundlingStrategy('adaptive');
  return await Promise.resolve(strategy.apply(options));
}
