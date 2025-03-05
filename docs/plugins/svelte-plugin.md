
# Plugin Svelte

Este plugin permite a compilação e processamento avançado de componentes Svelte em seu bundle.

## Instalação

```bash
npm install @ts-bundler/plugin-svelte
```

## Configuração

```javascript
// masterbundler.config.ts
import { defineConfig } from 'ts-bundler';
import sveltePlugin from '@ts-bundler/plugin-svelte';

export default defineConfig({
  // Configuração básica aqui
  plugins: [
    sveltePlugin({
      // Opções específicas do Svelte
      compilerOptions: {
        dev: process.env.NODE_ENV !== 'production',
        css: false // Extrair CSS em arquivos separados
      },
      preprocess: true, // Habilitar preprocessamento
      hot: true, // Habilitar Hot Module Replacement
    })
  ]
});
```

## Recursos

### Compilação de Componentes

O plugin compila automaticamente arquivos `.svelte` para JavaScript, lidando com a lógica, marcação HTML e estilos CSS.

### Hot Module Replacement (HMR)

Suporte completo a HMR para desenvolvimento rápido. Alterações nos componentes Svelte são refletidas instantaneamente no navegador sem perder o estado.

### Otimização para Produção

Em modo de produção, o plugin aplica automaticamente:
- Minificação de marcação
- Otimização de compilador
- Eliminação de código morto
- Extração de CSS crítico

## Exemplos

### Componente Básico

```svelte
<script>
  export let name = 'world';
  let count = 0;
  
  function increment() {
    count += 1;
  }
</script>

<h1>Hello {name}!</h1>
<button on:click={increment}>
  Clicks: {count}
</button>

<style>
  h1 {
    color: #ff3e00;
  }
  button {
    background: #ff3e00;
    color: white;
    border: none;
    padding: 8px 12px;
    border-radius: 4px;
  }
</style>
```

## Próximas Melhorias

- Suporte a SSR (Server-Side Rendering)
- Melhorias de desempenho para componentes grandes
- Integração com ferramentas de análise de acessibilidade
- HMR (Hot Module Replacement) avançado para desenvolvimento mais rápido)
- Carregamento dinâmico de componentes
- Extração automática de CSS crítico
- Suporte aprimorado para TypeScript no template


# Plugin Svelte

## Visão geral

O plugin Svelte para TypeScript Bundler permite processar e otimizar componentes Svelte (.svelte) em seu projeto.

## Instalação

```bash
npm install --save-dev @ts-bundler/svelte-plugin svelte
```

## Configuração básica

```javascript
// masterbundler.config.ts
import { defineConfig } from 'typescript-bundler';
import sveltePlugin from '@ts-bundler/svelte-plugin';

export default defineConfig({
  // configurações básicas...
  plugins: [
    sveltePlugin({
      // opções de compilação do Svelte
      compilerOptions: {
        dev: process.env.NODE_ENV !== 'production',
      },
      // opções de preprocessamento
      preprocess: [], 
    }),
  ],
});
```

## Funcionalidades

- Compilação eficiente de componentes Svelte
- Suporte completo a TypeScript em componentes Svelte
- Hot Module Replacement (HMR) para desenvolvimento rápido
- Otimizações para produção
- Suporte a preprocessadores (SCSS, PostCSS, etc.)

## Opções avançadas

### Integração com SvelteKit

Para projetos SvelteKit, configurações adicionais podem ser necessárias:

```javascript
sveltePlugin({
  // ... outras opções
  kit: true, // Habilita suporte a SvelteKit
  emitCss: true, // Extrai CSS para arquivos separados
})
```

### CSS customizado

```javascript
sveltePlugin({
  // ... outras opções
  emitCss: true,
  cssProcessor: {
    render(code, filename) {
      // Processa o CSS extraído
      return code;
    }
  }
})
```

## Exemplos

### Componente Svelte básico

```svelte
<script lang="ts">
  export let name: string;
</script>

<h1>Hello {name}!</h1>

<style>
  h1 {
    color: #ff3e00;
  }
</style>
```

### Uso com outras ferramentas

O plugin Svelte funciona bem junto com outros plugins do TypeScript Bundler:

```javascript
// masterbundler.config.ts
import { defineConfig } from 'typescript-bundler';
import sveltePlugin from '@ts-bundler/svelte-plugin';
import cssPlugin from 'typescript-bundler/plugins/css';
import assetPlugin from 'typescript-bundler/plugins/asset';

export default defineConfig({
  // configurações básicas...
  plugins: [
    sveltePlugin(),
    cssPlugin(),
    assetPlugin(),
  ],
});
```
# Plugin Svelte

O plugin Svelte para o TypeScript Bundler permite compilar e otimizar componentes Svelte em seu projeto.

## Instalação

Para instalar o plugin Svelte, utilize o comando:

```bash
ts-bundler marketplace install svelte-plugin
```

Ou adicione manualmente ao seu arquivo de configuração:

```javascript
// masterbundler.config.ts
export default {
  // ... outras configurações
  plugins: ['svelte-plugin'],
  svelteOptions: {
    // opções específicas do Svelte
  }
};
```

## Recursos

- Compilação de componentes Svelte (`.svelte`)
- Hot Module Replacement (HMR) durante desenvolvimento
- Suporte a TypeScript em componentes Svelte
- Compressão e otimização para produção
- Integração com pré-processadores CSS (SCSS, Less, etc.)

## Uso

Simplesmente importe componentes Svelte em seu código:

```typescript
import App from './App.svelte';

const app = new App({
  target: document.body,
  props: {
    name: 'world'
  }
});

export default app;
```

## Configuração

O plugin Svelte aceita as seguintes opções:

```javascript
// masterbundler.config.ts
export default {
  // ... outras configurações
  plugins: ['svelte-plugin'],
  svelteOptions: {
    compilerOptions: {
      dev: process.env.NODE_ENV !== 'production',
      css: false, // extrair CSS para arquivo separado
      hydratable: true, // para SSR
    },
    preprocess: [], // pré-processadores como svelte-preprocess
    emitCss: true, // emitir CSS como arquivos separados
    hot: true, // HMR
    extensions: ['.svelte'] // extensões a processar
  }
};
```

## Exemplo Completo

Aqui está um exemplo completo de configuração para um projeto Svelte:

```javascript
// masterbundler.config.ts
import sveltePreprocess from 'svelte-preprocess';

export default {
  input: 'src/main.ts',
  outDir: 'dist',
  format: 'esm',
  minify: true,
  sourcemap: true,
  plugins: ['svelte-plugin'],
  svelteOptions: {
    compilerOptions: {
      dev: process.env.NODE_ENV !== 'production',
    },
    preprocess: sveltePreprocess({
      scss: true,
      typescript: true
    }),
    emitCss: true,
    hot: true
  }
};
```

## Recursos adicionais

- [Documentação oficial do Svelte](https://svelte.dev/docs)
- [SvelteKit](https://kit.svelte.dev/) - Framework construído sobre Svelte
# Plugin Svelte

O plugin Svelte para o TypeScript Bundler permite compilar e otimizar componentes Svelte em suas aplicações.

## Instalação

```bash
npm install --save-dev ts-bundler-svelte-plugin
```

## Configuração Básica

Adicione o plugin à sua configuração:

```javascript
// masterbundler.config.ts
import { defineConfig } from 'typescript-bundler';
import sveltePlugin from 'ts-bundler-svelte-plugin';

export default defineConfig({
  input: 'src/index.ts',
  output: {
    dir: 'dist',
    format: 'esm'
  },
  plugins: [
    sveltePlugin({
      // opções do plugin
      compilerOptions: {
        dev: process.env.NODE_ENV !== 'production',
        css: false // extrair CSS para arquivos separados
      },
      preprocess: true, // habilitar preprocessadores
      hot: true, // habilitar HMR
    })
  ]
});
```

## Características Principais

- **Compilação Svelte**: Transforma arquivos `.svelte` em JavaScript e CSS
- **Hot Module Replacement**: Atualização em tempo real durante o desenvolvimento
- **Otimização para produção**: Minificação e compressão para ambientes de produção
- **Preprocessadores**: Suporte a SCSS, TypeScript e outros dentro de componentes Svelte
- **Integração com TypeScript**: Verificação de tipos em templates Svelte

## Opções Avançadas

### Customização de Preprocessadores

```javascript
import { defineConfig } from 'typescript-bundler';
import sveltePlugin from 'ts-bundler-svelte-plugin';
import sveltePreprocess from 'svelte-preprocess';

export default defineConfig({
  // ... outras configurações
  plugins: [
    sveltePlugin({
      preprocess: sveltePreprocess({
        typescript: {
          tsconfigFile: './tsconfig.json'
        },
        scss: {
          includePaths: ['src/styles']
        },
        postcss: true
      })
    })
  ]
});
```

### Configuração de SvelteKit

Para projetos SvelteKit, habilite opções específicas:

```javascript
sveltePlugin({
  kit: true, // habilita suporte para SvelteKit
  compilerOptions: {
    hydratable: true
  }
})
```

## Exemplos de Uso

### Componente Básico

```svelte
<!-- Button.svelte -->
<script lang="ts">
  export let text: string = 'Clique-me';
  export let primary: boolean = false;
  
  function handleClick() {
    console.log('Botão clicado!');
  }
</script>

<button 
  class:primary
  on:click={handleClick}
>
  {text}
</button>

<style lang="scss">
  button {
    padding: 8px 16px;
    border-radius: 4px;
    border: none;
    cursor: pointer;
    
    &.primary {
      background-color: #3498db;
      color: white;
    }
  }
</style>
```

### Importação em TypeScript

```typescript
// index.ts
import Button from './components/Button.svelte';

const app = new Button({
  target: document.body,
  props: {
    text: 'Olá Mundo',
    primary: true
  }
});

export default app;
```

## Resolução de Problemas

### Erro: Cannot find module '*.svelte'

Adicione a seguinte declaração de tipos:

```typescript
// svelte.d.ts
declare module '*.svelte' {
  import type { ComponentType } from 'svelte';
  const component: ComponentType;
  export default component;
}
```

### Erro: Preprocessor dependency missing

Se receber erros sobre dependências de preprocessadores faltando, instale-as:

```bash
npm install --save-dev sass postcss autoprefixer
```

## Próximas Melhorias

- Suporte a SSR (Server-Side Rendering)
- Melhorias de desempenho para componentes grandes
- Integração com ferramentas de análise de acessibilidade
- HMR (Hot Module Replacement) avançado para desenvolvimento mais rápido)
- Carregamento dinâmico de componentes
- Extração automática de CSS crítico
- Suporte aprimorado para TypeScript no template
