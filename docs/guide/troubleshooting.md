
# Resolução de Problemas

Este guia ajuda a resolver problemas comuns encontrados ao usar o TypeScript Bundler.

## Erros Comuns

### Erro: Cannot find module

**Problema:**
```
Error: Cannot find module 'some-module'
```

**Solução:**
1. Verifique se o módulo está instalado:
   ```bash
   npm install some-module
   ```
2. Certifique-se de que o caminho de importação está correto
3. Verifique se o módulo é compatível com o formato de saída escolhido

### Erro: TypeScript type checking failed

**Problema:**
```
TypeScript error: Property does not exist on type 'X'
```

**Solução:**
1. Verifique se os tipos estão definidos corretamente
2. Atualize as definições de tipos:
   ```bash
   npm install @types/some-module
   ```
3. Use asserções de tipo quando necessário:
   ```typescript
   (myVar as SomeType).property
   ```

### Erro: Output directory already exists

**Problema:**
```
Error: Output directory 'dist' already exists
```

**Solução:**
1. Use a flag `--force` para sobrescrever:
   ```bash
   ts-bundler --force
   ```
2. Limpe o diretório antes de construir:
   ```bash
   rm -rf dist && ts-bundler
   ```

### Erro: Plugin load failed

**Problema:**
```
Error: Failed to load plugin 'custom-plugin'
```

**Solução:**
1. Verifique se o plugin está instalado
2. Certifique-se de que o nome do plugin está correto
3. Confirme que o plugin é compatível com sua versão do bundler

## Problemas de Performance

### Build Lenta

**Sintomas:**
- Builds demorando mais de 30 segundos
- Uso excessivo de CPU

**Soluções:**
1. Ative o cache:
   ```bash
   ts-bundler --cache-strategy filesystem
   ```
2. Reduza a quantidade de módulos incluídos:
   ```javascript
   // bundler.config.js
   module.exports = {
     external: ['lodash', 'react', 'react-dom']
   };
   ```
3. Desative a minificação durante o desenvolvimento:
   ```bash
   ts-bundler --no-minify
   ```

### Consumo Alto de Memória

**Sintomas:**
- Erro "JavaScript heap out of memory"
- Processo encerrando inesperadamente

**Soluções:**
1. Aumente o limite de memória do Node.js:
   ```bash
   NODE_OPTIONS=--max-old-space-size=4096 ts-bundler
   ```
2. Divida o bundle em chunks menores:
   ```javascript
   // bundler.config.js
   module.exports = {
     strategy: 'dynamic',
     preserveModules: true
   };
   ```

## Problemas com Watch Mode

### Alterações Não Detectadas

**Problema:**
O bundler não reconstrói quando os arquivos são alterados.

**Soluções:**
1. Especifique o diretório de observação:
   ```bash
   ts-bundler --watch --watch-dir src
   ```
2. Verifique se existem problemas com o sistema de arquivos (por exemplo, problemas de permissão)
3. Reinicie o processo de observação

### Live Reload Não Funciona

**Problema:**
O navegador não atualiza automaticamente quando as alterações são feitas.

**Soluções:**
1. Certifique-se de que a flag `--liveReload` está ativada:
   ```bash
   ts-bundler --watch --liveReload
   ```
2. Verifique se o script de live reload está injetado no HTML
3. Certifique-se de que as portas necessárias estão abertas

## Problemas de Plugins

### Plugin Incompatível

**Problema:**
Erro "Plugin API version mismatch"

**Solução:**
1. Atualize o plugin para uma versão compatível
2. Verifique a documentação do plugin para requisitos específicos
3. Contate o autor do plugin para suporte

### Múltiplos Plugins Conflitantes

**Problema:**
Plugins estão interferindo uns com os outros, causando erros ou comportamento inesperado.

**Solução:**
1. Altere a ordem dos plugins:
   ```javascript
   // bundler.config.js
   module.exports = {
     plugins: ['plugin1', 'plugin2'] // A ordem importa
   };
   ```
2. Desative plugins um por um para identificar o conflito
3. Verifique as configurações específicas de cada plugin

## Problemas de Bundling

### Bundle Muito Grande

**Problema:**
O bundle final é muito grande para produção.

**Soluções:**
1. Analise o bundle para identificar problemas:
   ```bash
   ts-bundler analyze
   ```
2. Use tree shaking:
   ```javascript
   // bundler.config.js
   module.exports = {
     treeShaking: true,
     format: 'esm' // ESM suporta melhor tree shaking
   };
   ```
3. Separe dependências grandes:
   ```javascript
   // bundler.config.js
   module.exports = {
     external: ['lodash', 'chart.js']
   };
   ```

### Código Quebrado em Produção

**Problema:**
O código funciona localmente, mas quebra depois de bundled.

**Soluções:**
1. Verifique se há diferenças de ambiente:
   ```javascript
   // bundler.config.js
   module.exports = {
     define: {
       'process.env.NODE_ENV': JSON.stringify('production')
     }
   };
   ```
2. Use source maps para debug:
   ```bash
   ts-bundler --sourcemap
   ```
3. Teste com diferentes formatos de saída
4. Verifique problemas de minificação:
   ```bash
   ts-bundler --no-minify # Para testar
   ```

## Contato e Suporte

Se você não conseguir resolver seu problema com este guia:

1. Abra uma issue no GitHub
2. Participe do canal da comunidade
3. Consulte a documentação completa
4. Considere o patrocínio para suporte prioritário
