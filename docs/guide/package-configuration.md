
# Configuração do package.json

Quando você usa o Master Bundler como uma dependência em seus projetos, precisa configurar corretamente seu `package.json` para obter os melhores resultados. Esta página explica as configurações necessárias e recomendadas.

## Configuração Básica

Aqui está um exemplo de um `package.json` configurado para usar o Master Bundler:

```json
{
  "name": "seu-pacote",
  "version": "1.0.0",
  "description": "Descrição do seu pacote",
  "main": "dist/index.js",         // Para consumidores CommonJS
  "module": "dist/index.mjs",      // Para consumidores ESM
  "types": "dist/index.d.ts",      // Definições de tipos TypeScript
  "exports": {
    ".": {
      "require": "./dist/index.js",
      "import": "./dist/index.mjs",
      "types": "./dist/index.d.ts"
    }
  },
  "files": [
    "dist"
  ],
  "scripts": {
    "build": "master-bundler",
    "dev": "master-bundler --watch"
  },
  "devDependencies": {
    "master-bundler": "^3.0.0",
    "typescript": "^5.0.0"
  }
}
```

## Explicação dos Campos

### Campos de Entrada

- `main`: Aponta para o bundle CommonJS (formato .js) - usado por Node.js e bundlers mais antigos
- `module`: Aponta para o bundle ESM (formato .mjs) - usado por bundlers modernos e navegadores
- `types`: Aponta para as declarações de tipos TypeScript - usado por editores e pelo compilador TypeScript

### Campo exports

O campo `exports` é uma funcionalidade do Node.js que permite definir pontos de entrada específicos para diferentes ambientes. Isso garante que os importadores obtenham o formato correto do seu pacote:

```json
"exports": {
  ".": {
    "require": "./dist/index.js",  // Para require() (CommonJS)
    "import": "./dist/index.mjs",  // Para import (ESM)
    "types": "./dist/index.d.ts"   // Para TypeScript
  }
}
```

### Campo files

O campo `files` especifica quais arquivos serão incluídos quando seu pacote for publicado no npm. Isso ajuda a reduzir o tamanho do pacote:

```json
"files": [
  "dist"
]
```

## Scripts de Build

Adicione scripts de build e desenvolvimento para facilitar o uso do Master Bundler:

```json
"scripts": {
  "build": "master-bundler",
  "dev": "master-bundler --watch"
}
```

## Exemplo Completo para Biblioteca com Múltiplas Entradas

Para bibliotecas com múltiplas entradas (por exemplo, uma biblioteca de componentes UI):

```json
{
  "name": "sua-biblioteca-ui",
  "version": "1.0.0",
  "description": "Biblioteca de componentes UI",
  "main": "dist/index.js",
  "module": "dist/index.mjs",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "require": "./dist/index.js",
      "import": "./dist/index.mjs",
      "types": "./dist/index.d.ts"
    },
    "./button": {
      "require": "./dist/button.js",
      "import": "./dist/button.mjs",
      "types": "./dist/button.d.ts"
    },
    "./input": {
      "require": "./dist/input.js",
      "import": "./dist/input.mjs",
      "types": "./dist/input.d.ts"
    }
  },
  "files": [
    "dist"
  ],
  "scripts": {
    "build": "master-bundler",
    "dev": "master-bundler --watch"
  },
  "devDependencies": {
    "master-bundler": "^3.0.0",
    "typescript": "^5.0.0"
  }
}
```

## Configuração do Master Bundler

Para que o Master Bundler funcione corretamente com sua configuração de package.json, certifique-se de que o arquivo `masterbundler.config.ts` esteja configurado para gerar os formatos correspondentes:

```typescript
const config = {
  input: 'src/index.ts',
  outDir: 'dist',
  format: ['esm', 'cjs'],
  // Outras configurações...
};

export default config;
```
