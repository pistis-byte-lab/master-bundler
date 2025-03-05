
# Exemplos Detalhados

Esta seção fornece exemplos práticos de uso do TypeScript Bundler em diferentes cenários.

## Exemplo 1: Projeto React Básico

### Estrutura do Projeto
```
my-react-app/
├── src/
│   ├── components/
│   │   ├── App.tsx
│   │   └── Button.tsx
│   ├── styles/
│   │   └── main.css
│   └── index.tsx
├── bundler.config.js
└── package.json
```

### Configuração
```javascript
// bundler.config.js
module.exports = {
  input: 'src/index.tsx',
  outDir: 'dist',
  format: 'esm',
  minify: true,
  sourcemap: true,
  plugins: ['css-plugin', 'asset-plugin'],
  external: ['react', 'react-dom'],
  globals: {
    'react': 'React',
    'react-dom': 'ReactDOM'
  }
};
```


node-app/
├── src/
│   ├── api/
│   │   ├── users.ts
│   │   └── products.ts
│   ├── models/
│   │   ├── User.ts
│   │   └── Product.ts
│   └── index.ts
├── bundler.config.js
└── package.json
```

### Configuração
```javascript
// bundler.config.js
module.exports = {
  input: 'src/index.ts',
  outDir: 'dist',
  format: 'cjs',
  target: 'node14',
  strategy: 'dynamic',
  preserveModules: true,
  minify: false,
  sourcemap: true,
  plugins: ['node-resolve-plugin']
};
```

### Comando de Build
```bash
ts-bundler
```

## Exemplo 4: Aplicação Web com CSS e Recursos Estáticos

### Estrutura do Projeto
```
web-app/
├── src/
│   ├── components/
│   │   ├── Header.ts
│   │   └── Footer.ts
│   ├── styles/
│   │   ├── main.css
│   │   └── variables.css
│   ├── assets/
│   │   ├── logo.svg
│   │   └── background.png
│   └── index.ts
├── bundler.config.js
└── package.json
```

### Configuração
```javascript
// bundler.config.js
module.exports = {
  input: 'src/index.ts',
  outDir: 'dist',
  format: 'esm',
  minify: true,
  sourcemap: true,
  plugins: ['css-plugin', 'asset-plugin'],
  assetOptions: {
    publicPath: '/assets/',
    imagesFolder: 'images',
    limit: 8192  // inline if smaller than 8kb
  }
};
```

### Comando de Build
```bash
ts-bundler
```

## Exemplo 5: Biblioteca com Tipos TypeScript

### Estrutura do Projeto
```
my-ts-lib/
├── src/
│   ├── modules/
│   │   ├── core.ts
│   │   └── helpers.ts
│   └── index.ts
├── bundler.config.js
└── package.json
```

### Configuração
```javascript
// bundler.config.js
module.exports = {
  input: 'src/index.ts',
  outDir: 'dist',
  format: ['esm', 'cjs'],
  declaration: true,
  declarationDir: 'types',
  minify: {
    compress: true,
    mangle: true,
    keepClassNames: true,  // preserve class names for better types
  },
  sourcemap: true,
  plugins: ['typescript-declaration-plugin']
};
```

### package.json
```json
{
  "name": "my-ts-lib",
  "version": "1.0.0",
  "main": "dist/cjs/index.js",
  "module": "dist/esm/index.js",
  "types": "types/index.d.ts",
  "scripts": {
    "build": "ts-bundler"
  }
}
```

## Exemplo 6: Aplicação com Estratégia de Bundling Avançada

### Estrutura do Projeto
```
advanced-app/
├── src/
│   ├── modules/
│   │   ├── dashboard/
│   │   │   ├── index.ts
│   │   │   └── widgets/
│   │   ├── settings/
│   │   │   └── index.ts
│   │   └── auth/
│   │       └── index.ts
│   └── index.ts
├── bundler.config.js
└── package.json
```

### Configuração
```javascript
// bundler.config.js
module.exports = {
  input: 'src/index.ts',
  outDir: 'dist',
  format: 'esm',
  minify: true,
  sourcemap: true,
  strategy: 'dynamic',
  manualChunks: {
    'vendor': ['lodash', 'axios'],
    'ui': ['react', 'react-dom']
  },
  preloadModules: ['src/modules/auth/index.ts'],
  workerModules: ['src/modules/data-processor.ts'],
  plugins: ['code-splitting-plugin', 'bundle-analyzer-plugin']
};
```

### Comando de Build com Análise
```bash
ts-bundler --analyze
```

### Comando de Build
```bash
ts-bundler
```

## Exemplo 2: Biblioteca TypeScript com Múltiplos Formatos

### Estrutura do Projeto
```
my-library/
├── src/
│   ├── utils/
│   │   ├── math.ts
│   │   └── string.ts
│   └── index.ts
├── bundler.config.js
└── package.json
```

### Configuração
```javascript
// bundler.config.js
module.exports = {
  input: 'src/index.ts',
  outDir: 'dist',
  formats: ['esm', 'cjs', 'umd'],
  minify: true,
  sourcemap: true,
  target: ['es2019', 'node12'],
  umdName: 'MyLibrary',
  declaration: true
};
```

### Comando de Build
```bash
ts-bundler
```

## Exemplo 3: Aplicação Node.js com Code Splitting

### Estrutura do Projeto
```
node-app/
├── src/
│   ├── modules/
│   │   ├── auth.ts
│   │   ├── database.ts
│   │   └── api.ts
│   └── index.ts
├── bundler.config.js
└── package.json
```

### Configuração
```javascript
// bundler.config.js
module.exports = {
  input: 'src/index.ts',
  outDir: 'dist',
  format: 'cjs',
  minify: false,
  sourcemap: true,
  target: ['node14'],
  codeSplitting: true,
  external: ['express', 'mongoose']
};
```

### Comando de Build
```bash
ts-bundler
```

## Exemplo 4: Aplicação Web com Otimização de Imagens

### Estrutura do Projeto
```
web-app/
├── src/
│   ├── assets/
│   │   ├── images/
│   │   │   ├── logo.png
│   │   │   └── background.jpg
│   │   └── fonts/
│   │       └── custom-font.woff2
│   ├── styles/
│   │   └── main.scss
│   └── index.ts
├── bundler.config.js
└── package.json
```

### Configuração
```javascript
// bundler.config.js
module.exports = {
  input: 'src/index.ts',
  outDir: 'dist',
  format: 'esm',
  minify: true,
  sourcemap: true,
  plugins: ['css-plugin', 'asset-plugin'],
  pluginOptions: {
    'asset-plugin': {
      imageOptimization: {
        enabled: true,
        quality: 85
      },
      fingerprinting: true,
      manifestPath: 'asset-manifest.json'
    }
  }
};
```

### Comando de Build
```bash
ts-bundler
```

## Exemplo 5: Projeto com Múltiplos Ambientes

### Estrutura do Projeto
```
multi-env-app/
├── src/
│   └── index.ts
├── bundler.config.js
├── .env
├── .env.development
└── .env.production
```

### Configuração
```javascript
// bundler.config.js
module.exports = {
  input: 'src/index.ts',
  outDir: 'dist',
  format: 'esm',
  minify: true,
  sourcemap: true,
  environments: {
    development: {
      minify: false,
      sourcemap: 'inline'
    },
    production: {
      minify: true,
      sourcemap: false
    }
  }
};
```

### Comando de Build
```bash
# Desenvolvimento
NODE_ENV=development ts-bundler

# Produção
NODE_ENV=production ts-bundler
```
