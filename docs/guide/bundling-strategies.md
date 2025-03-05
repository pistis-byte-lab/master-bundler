
# Estratégias de Bundling

O TypeScript Bundler oferece várias estratégias avançadas de bundling para otimizar o processo de empacotamento de acordo com as necessidades específicas do seu projeto. Cada estratégia é projetada para diferentes casos de uso e oferece benefícios distintos.

## Estratégias Disponíveis

### Single Bundle

A estratégia mais simples, que gera um único arquivo contendo todo o código da aplicação.

**Ideal para:**
- Aplicações pequenas
- Projetos com poucas dependências
- Casos em que a simplicidade é prioridade

**Uso:**
```bash
ts-bundler src/index.ts --strategy single
```

### Multiple Bundles

Divide o código em múltiplos bundles, separando o código da aplicação das dependências de terceiros.

**Ideal para:**
- Aplicações de médio porte
- Projetos com dependências estáveis que mudam com pouca frequência

**Uso:**
```bash
ts-bundler src/index.ts --strategy multiple
```

### Dynamic Chunking

Gera chunks de código que são carregados dinamicamente conforme necessário, utilizando importações dinâmicas.

**Ideal para:**
- Aplicações grandes
- Projetos com diferentes rotas ou funcionalidades independentes
- Casos em que o tempo de carregamento inicial é crítico

**Uso:**
```bash
ts-bundler src/index.ts --strategy dynamic
```

### Adaptive

Analisa automaticamente seu projeto e determina a melhor estratégia de bundling, ajustando configurações conforme necessário.

**Ideal para:**
- Desenvolvedores que não têm certeza sobre qual estratégia usar
- Projetos com características mistas

**Uso:**
```bash
ts-bundler src/index.ts --strategy adaptive
```

### Differential Loading

Gera diferentes bundles otimizados para browsers modernos e legados.

**Ideal para:**
- Aplicações que precisam suportar uma ampla gama de browsers
- Projetos que desejam oferecer código otimizado para browsers modernos sem penalizar usuários de browsers antigos

**Uso:**
```bash
ts-bundler src/index.ts --strategy differential
```

### Worker Strategy

Extrai código intensivo em processamento para web workers.

**Ideal para:**
- Aplicações com operações pesadas de CPU
- Projetos que precisam manter a UI responsiva durante processamento intensivo

**Uso:**
```bash
ts-bundler src/index.ts --strategy worker --worker-modules util/heavy-calculation,services/image-processor
```

### Preload Strategy

Identifica e pré-carrega módulos críticos para o primeiro render.

**Ideal para:**
- Aplicações focadas em performance de primeiro carregamento
- Projetos com funcionalidades críticas que devem ser carregadas imediatamente

**Uso:**
```bash
ts-bundler src/index.ts --strategy preload --preload-modules components/header,services/auth
```

## Analisando seu Projeto

O TypeScript Bundler pode analisar seu projeto e recomendar a melhor estratégia:

```bash
ts-bundler strategy analyze src/index.ts
```

Para obter detalhes completos da análise:

```bash
ts-bundler strategy analyze src/index.ts --details
```

## Configuração Avançada

Cada estratégia pode ser configurada através de opções adicionais no arquivo de configuração:

```js
// bundler.config.js
module.exports = {
  input: 'src/index.ts',
  output: 'dist',
  format: 'esm',
  strategy: 'dynamic',
  
  // Opções específicas da estratégia
  strategiesOptions: {
    preserveModules: false,
    inlineDynamicImports: false,
    
    // Para a estratégia worker
    workerModules: [
      'src/workers/heavy-calculation.ts',
      'src/services/image-processor.ts'
    ],
    
    // Para a estratégia preload
    preloadModules: [
      'src/components/header.ts',
      'src/services/auth.ts'
    ],
    
    // Para differential loading
    modern: true, // definido para gerar o bundle moderno
  }
};
```

## Métricas e Análise

Para medir o impacto de diferentes estratégias, você pode usar o comando `analyze`:

```bash
ts-bundler analyze --compare-strategies
```

Isso gerará um relatório comparando diferentes estratégias aplicadas ao seu projeto.
