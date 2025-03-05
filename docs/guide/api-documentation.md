
# Documentação da API

Esta seção detalha a API do TypeScript Bundler, que pode ser usada programaticamente em seus projetos.

## API Principal

### `bundle(options)`

A função principal que inicia o processo de bundling.

```typescript
import { bundle } from 'ts-bundler';

const result = await bundle({
  input: 'src/index.ts',
  format: 'esm',
  outDir: 'dist',
  minify: true
});

console.log(`Bundle gerado: ${result.code.length} bytes`);
```

#### Parâmetros

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `input` | `string` | Caminho para o arquivo de entrada |
| `outDir` | `string` | Diretório de saída |
| `format` | `'esm' \| 'cjs' \| 'umd'` | Formato de saída do bundle |
| `minify` | `boolean \| object` | Ativar minificação ou opções de minificação |
| `sourcemap` | `boolean` | Gerar source maps |
| `target` | `string \| string[]` | Alvos de compilação (ex: 'es2019', 'node12') |
| `plugins` | `string[] \| Plugin[]` | Plugins a serem utilizados |
| `external` | `string[]` | Módulos a serem tratados como externos |
| `globals` | `Record<string, string>` | Mapeamento de módulos externos para variáveis globais |
| `name` | `string` | Nome do pacote para formato UMD |
| `watch` | `boolean` | Habilitar modo de observação |
| `strategy` | `BundlingStrategyType` | Estratégia de bundling a ser utilizada |
| `liveReload` | `boolean` | Habilitar live reload no modo de observação |
| `manualChunks` | `Record<string, string[]>` | Configuração de chunks manuais |
| `preloadModules` | `string[]` | Módulos a serem pré-carregados |
| `workerModules` | `string[]` | Módulos a serem executados em workers |

#### Retorno

Retorna uma promessa que resolve para um objeto `BuildResult`:

```typescript
interface BuildResult {
  code: string;
  map?: string;
  declarations?: string;
}
```

### `Watcher`

Classe para observar mudanças em arquivos e reconstruir automaticamente.

```typescript
import { Watcher } from 'ts-bundler';

const watcher = new Watcher({
  input: 'src/index.ts',
  format: 'esm',
  outDir: 'dist'
});

await watcher.start();

// Para parar o watcher
watcher.stop();
```

#### Métodos

| Método | Descrição |
|--------|-----------|
| `start()` | Inicia o watcher |
| `stop()` | Para o watcher |
| `onFileChange(callback)` | Registra um callback para mudanças de arquivo |
| `onBuildComplete(callback)` | Registra um callback para quando a build for completada |

## API de Plugins

### Interface `Plugin`

Interface que todos os plugins devem implementar:

```typescript
interface Plugin {
  name: string;
  buildStart?(context: PluginContext, options: BundleOptions): Promise<void>;
  transform?(context: TransformContext): Promise<TransformContext>;
  buildEnd?(context: PluginContext, error?: Error): Promise<void>;
  cleanup?(): Promise<void>;
}
```

### `PluginManager`

Classe responsável por gerenciar e executar plugins:

```typescript
import { PluginManager } from 'ts-bundler';

const pluginManager = new PluginManager({
  enableHotReload: true,
  configPath: './plugin-config.json'
});

await pluginManager.initialize();
pluginManager.registerPlugin(myCustomPlugin);

// Executar um hook específico
await pluginManager.executeHook('transform', context);

// Limpar recursos
pluginManager.dispose();
```

## Estratégias de Bundling

### `applyBundlingStrategy`

Função para aplicar uma estratégia de bundling às opções:

```typescript
import { applyBundlingStrategy } from 'ts-bundler';

const enhancedOptions = await applyBundlingStrategy(options, 'dynamic');
```

#### Estratégias Disponíveis

| Estratégia | Descrição |
|------------|-----------|
| `'single'` | Gera um único bundle com todo o código |
| `'multiple'` | Separa o bundle em múltiplos arquivos |
| `'dynamic'` | Utiliza importações dinâmicas para carregar módulos sob demanda |
| `'workers'` | Gera bundles separados para execução em Web Workers |
| `'modern'` | Gera bundles otimizados para navegadores modernos, com fallback |

## Análise de Bundle

### `analyze`

Função para analisar um bundle existente:

```typescript
import { analyze } from 'ts-bundler';

const analysis = await analyze('dist/bundle.js');
console.log(`Total size: ${analysis.totalSize} bytes`);
console.log(`Modules: ${analysis.modules.length}`);
```

#### Retorno

```typescript
interface BundleAnalysis {
  totalSize: number;
  minifiedSize: number;
  gzippedSize: number;
  modules: ModuleInfo[];
  duplicates: DuplicateModule[];
  unusedExports: string[];
  recommendations: string[];
}
```

## Cache Management

### `cacheManager`

API para gerenciar o cache do bundler:

```typescript
import { cacheManager } from 'ts-bundler';

// Verificar se um item está no cache
const isCached = await cacheManager.has('file-key');

// Obter um item do cache
const cachedItem = await cacheManager.get('file-key');

// Adicionar um item ao cache
await cacheManager.set('file-key', transformedCode);

// Limpar o cache
await cacheManager.clear();
```

## Utility Functions

### `createProgress`

Cria um indicador de progresso:

```typescript
import { createProgress } from 'ts-bundler';

const progress = createProgress({
  message: 'Building project',
  total: 100
});

progress.update({ current: 50, message: 'Processing files' });
progress.complete('Build completed successfully');
```

### `logger`

Utilitário para logging:

```typescript
import { logger } from 'ts-bundler';

logger.info('Starting build process');
logger.warn('Deprecated feature used');
logger.error('Build failed');
logger.success('Build completed');
```
