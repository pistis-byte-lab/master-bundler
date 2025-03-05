# Plugin Svelte

O plugin Svelte fornece suporte para compilar componentes Svelte em seu projeto.

## Instalação

```bash
npm install --save-dev svelte svelte-preprocess
```

## Configuração

```typescript
// masterbundler.config.ts
import { defineConfig } from '../src/config';

export default defineConfig({
  // ... outras configurações
  plugins: ['svelte'],
  pluginOptions: {
    svelte: {
      // Opções do svelte-preprocess
      preprocess: {
        scss: true,
        typescript: true
      },
      // Opções do compilador Svelte
      compilerOptions: {
        dev: process.env.NODE_ENV !== 'production'
      }
    }
  }
});
```

## Características

- Compilação automática de componentes `.svelte`
- Suporte para TypeScript em componentes Svelte
- Hot Module Replacement (HMR) para desenvolvimento rápido
- Otimizações para produção
- Suporte para preprocessadores (SCSS, PostCSS, etc.)
- Integração com outras ferramentas e frameworks

## Uso com outros frameworks

O plugin Svelte é totalmente compatível com os outros plugins de framework:

- React
- Vue
- Angular

Isso significa que você pode usar componentes Svelte em um projeto React, Vue ou Angular, e vice-versa, permitindo uma migração gradual ou uma abordagem de microfrontends.

## APIs avançadas

### Carregamento dinâmico

```javascript
// Importação dinâmica de um componente Svelte
const MyComponent = () => import('./components/MyComponent.svelte');
```

### SSR (Server-Side Rendering)

O plugin também suporta renderização no lado do servidor:

```typescript
import Component from './Component.svelte';

// Renderização do componente para HTML
const { html, css, head } = Component.render({ props });
```

### Componente Básico (Exemplo)

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