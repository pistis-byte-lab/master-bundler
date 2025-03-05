
# Guia Completo de Uso do TypeScript Bundler

Este guia fornece informações detalhadas sobre como usar o TypeScript Bundler para otimizar seus projetos.

## Instalação

Para instalar o TypeScript Bundler, use npm:

```bash
npm install -g ts-bundler
```

## Configuração Básica

A configuração mais simples requer apenas um arquivo de entrada:

```bash
ts-bundler --input src/index.ts --outDir dist
```

## Usando um Arquivo de Configuração

Para projetos mais complexos, crie um arquivo `bundler.config.js`:

```javascript
module.exports = {
  input: 'src/index.ts',
  outDir: 'dist',
  format: 'esm',
  minify: true,
  sourcemap: true,
  target: ['es2019'],
  plugins: ['css-plugin', 'asset-plugin']
};
```

## Formatos de Saída

O TypeScript Bundler suporta vários formatos de saída:

- **ESM** (ECMAScript Modules) - Padrão moderno para navegadores
- **CJS** (CommonJS) - Para Node.js
- **UMD** (Universal Module Definition) - Compatível com vários ambientes

## Plugins

### Plugins Internos

O bundler vem com vários plugins integrados:

- **css-plugin**: Processa arquivos CSS e SCSS
- **asset-plugin**: Gerencia arquivos estáticos

### Instalando Plugins do Marketplace

```bash
ts-bundler marketplace install plugin-name
```

### Criando Plugins Personalizados

Você pode criar seus próprios plugins implementando a interface de Plugin:

```typescript
// meu-plugin.ts
import { Plugin, PluginContext } from 'ts-bundler';

class MeuPlugin implements Plugin {
  name = 'meu-plugin';
  
  async buildStart(context: PluginContext) {
    console.log('Iniciando build com meu plugin');
  }
  
  async transform(context: PluginContext) {
    // Transformar código aqui
    return context;
  }
  
  async buildEnd(context: PluginContext) {
    console.log('Build finalizado');
  }
}

export default MeuPlugin;
```

## Modo de Desenvolvimento

Para desenvolvimento, use o modo de observação:

```bash
ts-bundler --watch
```

Opções adicionais para o modo de observação:

```bash
ts-bundler --watch --watch-dir src --liveReload
```

## Estratégias de Bundling

O TypeScript Bundler oferece diversas estratégias avançadas de bundling:

### Single Bundle

```bash
ts-bundler src/index.ts --strategy single
```

Gera um único arquivo de saída contendo todo o código.

### Multiple Bundles

```bash
ts-bundler src/index.ts --strategy multiple
```

Divide o código em vários arquivos, separando código da aplicação das dependências.

### Dynamic Chunking

```bash
ts-bundler src/index.ts --strategy dynamic
```

Cria chunks dinâmicos que são carregados sob demanda.

## Análise de Bundle

Para analisar o tamanho e composição do seu bundle:

```bash
ts-bundler analyze --input dist/bundle.js
```

A ferramenta de análise irá mostrar:
- Tamanho total do bundle
- Tamanho de cada módulo
- Dependências não utilizadas
- Sugestões de otimização

## Cache Management

O TypeScript Bundler utiliza um sistema de cache inteligente para acelerar builds subsequentes:

```bash
# Limpar o cache
ts-bundler --clear-cache

# Definir estratégia de cache
ts-bundler --cache-strategy memory
```

## Suporte para Patrocínio

Para apoiar o desenvolvimento do projeto:

```bash
ts-bundler sponsor --view
```

## Exemplos Avançados

### Code Splitting com Importações Dinâmicas

```typescript
// src/app.ts
const loadModule = async () => {
  const { default: module } = await import('./heavy-module');
  return module;
};

// Usar no bundler
ts-bundler src/app.ts --format esm --preserveModules
```

### Configuração de Minificação Avançada

```javascript
// bundler.config.js
module.exports = {
  input: 'src/index.ts',
  minify: {
    compress: true,
    mangle: true,
    toplevel: true,
    keepClassNames: false,
    keepFnNames: false
  }
};
```

### Integração com Server-Side Rendering

```javascript
// bundler.config.js
module.exports = {
  input: 'src/index.ts',
  formats: ['esm', 'cjs'],
  modern: true,
  target: ['esnext', 'node14'],
  plugins: ['ssr-plugin']
};
```

## Resolução de Problemas

### Erros Comuns

- **"Cannot find module"**: Verifique se todas as dependências estão instaladas.
- **"Type error"**: Problema de tipagem no código TypeScript.
- **"Output directory already exists"**: Use a flag `--force` para sobrescrever.

### Melhorando a Performance

- Use o modo `--watch` durante o desenvolvimento
- Ative o cache para builds mais rápidos
- Configure corretamente as dependências externas
- Utilize code splitting para melhor carregamento sob demanda
