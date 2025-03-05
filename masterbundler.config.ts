
import { BundleOptions } from './src/types';

/**
 * Configuração do TypeScript Bundler
 * 
 * Este arquivo configura o comportamento do bundler para seu projeto.
 */
const config: BundleOptions = {
  // Arquivo de entrada principal
  input: 'src/index.ts',
  
  // Diretório de saída
  outDir: 'dist',
  
  // Formato de saída (esm, cjs, umd)
  format: 'esm',
  
  // Minificar o código
  minify: true,
  
  // Gerar sourcemaps
  sourcemap: true,
  
  // Target ECMAScript
  target: ['es2019'],
  
  // Módulos externos que não devem ser incluídos no bundle
  external: [
    'react', 
    'react-dom'
  ],
  
  // Mapeamento de nomes globais para módulos externos (importante para UMD)
  globals: {
    'react': 'React',
    'react-dom': 'ReactDOM'
  },
  
  // Estratégia de bundling
  strategy: 'default',
  
  // Plugins a serem utilizados
  plugins: [
    'css-plugin',
    'asset-plugin'
  ],
  
  // Configurações específicas para plugins
  pluginOptions: {
    'css-plugin': {
      modules: true,
      extract: true
    },
    'asset-plugin': {
      limit: 8192
    }
  },
  
  // Variáveis de ambiente
  env: {
    NODE_ENV: 'production'
  },
  
  // Configurações específicas por ambiente
  environments: {
    development: {
      minify: false,
      sourcemap: true,
      env: {
        NODE_ENV: 'development'
      }
    },
    production: {
      minify: true,
      sourcemap: false
    }
  }
};

export default config;
