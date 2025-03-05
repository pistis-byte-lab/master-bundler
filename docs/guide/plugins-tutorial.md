
# Tutorial de Plugins

Este tutorial explica como criar, configurar e usar plugins no TypeScript Bundler.

## O que são Plugins?

Plugins são extensões que permitem personalizar o comportamento do bundler, adicionando novas funcionalidades ou modificando as existentes. Eles podem transformar código, processar arquivos específicos, adicionar otimizações e muito mais.

## Plugins Internos

O TypeScript Bundler vem com vários plugins internos:

- **css-plugin**: Processa arquivos CSS e SCSS
- **asset-plugin**: Gerencia arquivos estáticos como imagens e fontes
- **minification-plugin**: Reduz o tamanho do código
- **typescript-declaration-plugin**: Gera arquivos de declaração TypeScript

## Usando Plugins

### Via Linha de Comando

```bash
ts-bundler src/index.ts --plugins css-plugin,asset-plugin
```

### Via Arquivo de Configuração

```javascript
// bundler.config.js
module.exports = {
  input: 'src/index.ts',
  plugins: ['css-plugin', 'asset-plugin']
};
```

### Passando Opções para Plugins

```javascript
// bundler.config.js
module.exports = {
  input: 'src/index.ts',
  plugins: ['css-plugin', 'asset-plugin'],
  pluginOptions: {
    'css-plugin': {
      modules: true,
      minimize: true
    },
    'asset-plugin': {
      limit: 8192,
      publicPath: '/assets/'
    }
  }
};
```

## Criando um Plugin Personalizado

### Estrutura Básica

```typescript
// my-custom-plugin.ts
import { Plugin, PluginContext, TransformContext } from 'ts-bundler';

class MyCustomPlugin implements Plugin {
  name = 'my-custom-plugin';
  
  constructor(private options: any = {}) {
    // Inicialização com opções
  }

  async buildStart(context: PluginContext, options: any): Promise<void> {
    // Executado no início do processo de bundle
    console.log('Build started with options:', options);
  }

  async transform(context: TransformContext): Promise<TransformContext> {
    // Transforma o conteúdo do arquivo
    const { content, filePath } = context;
    
    // Exemplo: adiciona um comentário em cada arquivo JS/TS
    if (filePath.endsWith('.js') || filePath.endsWith('.ts')) {
      context.content = `// Processed by MyCustomPlugin\n${content}`;
    }
    
    return context;
  }

  async buildEnd(context: PluginContext, error?: Error): Promise<void> {
    // Executado no final do processo (com ou sem erro)
    if (error) {
      console.error('Build failed:', error.message);
    } else {
      console.log('Build completed successfully');
    }
  }

  async cleanup(): Promise<void> {
    // Limpa recursos alocados pelo plugin
    console.log('Cleaning up resources');
  }
}

export default MyCustomPlugin;
```

### Registrando o Plugin

```typescript
// index.ts
import { bundle } from 'ts-bundler';
import MyCustomPlugin from './my-custom-plugin';

const result = await bundle({
  input: 'src/index.ts',
  plugins: [new MyCustomPlugin({ option1: 'value1' })]
});
```

## Hooks de Plugin

Os plugins podem implementar vários hooks que são chamados em diferentes momentos do processo de bundling:

| Hook | Descrição |
|------|-----------|
| `buildStart` | Chamado no início do processo de bundle |
| `beforeTransform` | Chamado antes da transformação de um arquivo |
| `transform` | Chamado durante a transformação de um arquivo |
| `afterTransform` | Chamado após a transformação de um arquivo |
| `resolveId` | Chamado para resolver o ID (caminho) de um módulo |
| `load` | Chamado para carregar o conteúdo de um módulo |
| `buildEnd` | Chamado no final do processo de bundle |
| `generateBundle` | Chamado antes da geração do bundle final |
| `writeBundle` | Chamado após a escrita do bundle no disco |
| `cleanup` | Chamado para liberar recursos |

## Exemplos de Plugins

### Plugin de Banner

Adiciona um banner de comentário no topo dos arquivos de saída:

```typescript
// banner-plugin.ts
import { Plugin, PluginContext } from 'ts-bundler';

interface BannerPluginOptions {
  banner: string;
  include?: RegExp;
  exclude?: RegExp;
}

class BannerPlugin implements Plugin {
  name = 'banner-plugin';
  
  constructor(private options: BannerPluginOptions) {
    this.options.banner = this.options.banner || '';
    this.options.include = this.options.include || /\.(js|ts)$/;
    this.options.exclude = this.options.exclude || /node_modules/;
  }

  async generateBundle(context: PluginContext): Promise<void> {
    const { outputs } = context;
    
    for (const fileName in outputs) {
      if (this.shouldInclude(fileName)) {
        const output = outputs[fileName];
        output.code = `${this.options.banner}\n${output.code}`;
      }
    }
  }

  private shouldInclude(fileName: string): boolean {
    return this.options.include?.test(fileName) && 
           !this.options.exclude?.test(fileName);
  }
}

export default BannerPlugin;
```

### Plugin de Remoção de Console.log

Remove chamadas de console.log em produção:

```typescript
// remove-console-plugin.ts
import { Plugin, TransformContext } from 'ts-bundler';

class RemoveConsolePlugin implements Plugin {
  name = 'remove-console-plugin';
  
  constructor(private options: { production?: boolean } = {}) {}

  async transform(context: TransformContext): Promise<TransformContext> {
    // Só remove em produção se a opção estiver habilitada
    if (this.options.production === false) {
      return context;
    }
    
    const { content, filePath } = context;
    
    if (filePath.endsWith('.js') || filePath.endsWith('.ts')) {
      // Expressão regular para encontrar e remover console.log
      context.content = content.replace(
        /console\.log\s*\([^)]*\)\s*;?/g, 
        ''
      );
    }
    
    return context;
  }
}

export default RemoveConsolePlugin;
```

### Plugin de Internacionalização (i18n)

Extrai e substitui strings para internacionalização:

```typescript
// i18n-plugin.ts
import { Plugin, TransformContext } from 'ts-bundler';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface I18nPluginOptions {
  outputPath?: string;
  locales?: string[];
  defaultLocale?: string;
}

class I18nPlugin implements Plugin {
  name = 'i18n-plugin';
  private strings: Record<string, string> = {};
  
  constructor(private options: I18nPluginOptions = {}) {
    this.options.outputPath = this.options.outputPath || 'locales';
    this.options.locales = this.options.locales || ['en'];
    this.options.defaultLocale = this.options.defaultLocale || 'en';
  }

  async buildStart(): Promise<void> {
    // Inicializa o dicionário de strings
    this.strings = {};
  }

  async transform(context: TransformContext): Promise<TransformContext> {
    if (!context.filePath.endsWith('.ts') && !context.filePath.endsWith('.js')) {
      return context;
    }

    // Procura por padrões como i18n('texto a traduzir')
    const regex = /i18n\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    let match;
    
    while ((match = regex.exec(context.content)) !== null) {
      const key = match[1];
      this.strings[key] = key; // Armazena a string para gerar arquivos de tradução
    }

    return context;
  }

  async buildEnd(): Promise<void> {
    // Gera arquivos de tradução para cada locale
    for (const locale of this.options.locales) {
      const outputFile = join(this.options.outputPath, `${locale}.json`);
      
      // Cria um objeto com todas as strings encontradas
      const translations = Object.keys(this.strings).reduce((acc, key) => {
        acc[key] = locale === this.options.defaultLocale ? key : `[${locale}] ${key}`;
        return acc;
      }, {});
      
      // Escreve o arquivo de tradução
      writeFileSync(outputFile, JSON.stringify(translations, null, 2));
      console.log(`Generated translation file: ${outputFile}`);
    }
  }
}

export default I18nPlugin;
```

## Marketplace de Plugins

O TypeScript Bundler possui um marketplace onde você pode encontrar, instalar e compartilhar plugins:

```bash
# Listar plugins disponíveis
ts-bundler marketplace list

# Obter informações sobre um plugin
ts-bundler marketplace info image-plugin

# Instalar um plugin
ts-bundler marketplace install image-plugin

# Publicar seu plugin
ts-bundler marketplace publish ./my-plugin
```

## Melhores Práticas

1. **Mantenha os plugins focados**: cada plugin deve ter uma única responsabilidade
2. **Documente as opções**: forneça documentação clara sobre as opções do plugin
3. **Trate erros adequadamente**: não deixe que falhas em plugins quebrem todo o processo
4. **Teste extensivamente**: crie testes para diferentes cenários
5. **Otimize performance**: evite operações desnecessárias que podem atrasar o processo de bundling
6. **Forneça feedback**: use o sistema de log para informar o usuário sobre o que está acontecendo
7. **Preserve source maps**: garanta que transformações mantêm o mapeamento correto para debugging
