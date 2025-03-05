
# Guia de Manutenção da Documentação

Este guia explica como manter a documentação do TypeScript Bundler atualizada de forma automática.

## Visão Geral

O TypeScript Bundler inclui um sistema de geração automática de documentação que extrai comentários JSDoc do código fonte e os converte em arquivos Markdown estruturados. Isso garante que a documentação da API esteja sempre atualizada com o código.

## Como Funciona

1. O sistema analisa todos os arquivos TypeScript nos diretórios especificados
2. Extrai comentários JSDoc de classes, interfaces, funções e métodos
3. Gera arquivos Markdown formatados para cada arquivo de código
4. Cria uma estrutura de navegação hierárquica para facilitar o acesso

## Formato dos Comentários JSDoc

Para que a documentação seja gerada corretamente, é recomendado seguir estas convenções de comentários:

```typescript
/**
 * Descrição da função ou classe aqui.
 * Pode ter múltiplas linhas.
 *
 * @param {string} parametro1 - Descrição do primeiro parâmetro
 * @param {number} parametro2 - Descrição do segundo parâmetro
 * @returns {boolean} Descrição do valor de retorno
 *
 * @example
 * // Exemplo de uso
 * const resultado = minhaFuncao('teste', 123);
 */
```

## Comandos de Geração

Para gerar a documentação manualmente, execute:

```bash
npm run docs:generate
```

Para gerar e construir o site da documentação:

```bash
npm run docs:update
```

## CI/CD

A documentação é atualizada automaticamente durante o processo de CI/CD quando novos commits são enviados ao branch principal. Isso garante que a documentação publicada esteja sempre sincronizada com o código mais recente.

## Melhores Práticas

1. **Mantenha os comentários atualizados**: Atualize os comentários JSDoc sempre que alterar o código
2. **Forneça exemplos**: Sempre que possível, inclua exemplos de uso para API
3. **Descreva parâmetros**: Forneça descrições claras para todos os parâmetros
4. **Documente valores de retorno**: Explique o que a função retorna e em quais condições

## Solução de Problemas

Se a documentação não estiver sendo gerada corretamente:

1. Verifique se os comentários JSDoc estão formatados corretamente
2. Confirme se os arquivos estão nos diretórios corretos
3. Verifique se há erros de compilação TypeScript no código
4. Execute o gerador com a opção `-v` para obter logs detalhados
