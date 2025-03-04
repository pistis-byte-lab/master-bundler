
# Plugin API

Esta página documenta a API oficial para criar plugins para o TypeScript Bundler.

## Interface do Plugin

Todos os plugins devem implementar a interface `Plugin`:

```typescript
interface Plugin {
  name: string;
  defaultConfig?: PluginConfig;
  setup?: (options: BundleOptions, config?: PluginConfig) => void | Promise<void>;
  beforeTransform?: (context: PluginContext) => string | Promise<string>;
  transform?: (context: PluginContext) => string | Promise<string>;
  afterTransform?: (context: PluginContext) => string | Promise<string>;
  cleanup?: () => void | Promise<void>;
}
```

## Propriedades e Métodos

### `name`

Um identificador único para o seu plugin. Usado internamente para registro e referência.

### `defaultConfig`

Configuração padrão para o plugin. Será mesclada com qualquer configuração fornecida pelo usuário.

### `setup`

Chamado no início do processo de empacotamento. Use este hook para inicializar seu plugin com opções.

```typescript
setup(options: BundleOptions, config?: PluginConfig): void | Promise<void>
```

### `beforeTransform`

Chamado antes de qualquer transformação de código. Use este hook para análise inicial ou preparação.

```typescript
beforeTransform(context: PluginContext): string | Promise<string>
```

### `transform`

Chamado durante a fase principal de transformação de código.

```typescript
transform(context: PluginContext): string | Promise<string>
```

### `afterTransform`

Chamado após todas as transformações. Use este hook para modificações finais ou validação.

```typescript
afterTransform(context: PluginContext): string | Promise<string>
```

### `cleanup`

Chamado ao finalizar o empacotamento. Use este hook para limpar recursos.

```typescript
cleanup(): void | Promise<void>
```

## Contexto do Plugin

O objeto `PluginContext` fornece acesso a:

```typescript
interface PluginContext {
  options: BundleOptions;  // Opções do bundler
  filePath: string;        // Caminho do arquivo atual
  content: string;         // Conteúdo do arquivo sendo transformado
  config?: PluginConfig;   // Configuração específica do plugin
}
```
