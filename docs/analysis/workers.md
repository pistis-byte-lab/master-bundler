
# Web Workers Avançados

O TypeScript Bundler agora suporta uma API simplificada para a criação e gerenciamento de Web Workers, permitindo paralelização eficiente de tarefas.

## API Simplificada para Workers

A API simplificada permite criar e comunicar com Web Workers com muito menos código boilerplate:

```typescript
// Antes:
const worker = new Worker(new URL('./worker.js', import.meta.url));
worker.postMessage({ type: 'process', data: myData });
worker.onmessage = (event) => {
  console.log(event.data);
};

// Agora:
import { createWorker } from 'ts-bundler/workers';

const worker = createWorker((data) => {
  // Processamento aqui...
  return processedData;
});

const result = await worker.process(myData);
console.log(result);
```

## Visualização do Ciclo de Vida

A ferramenta de análise agora inclui um visualizador do ciclo de vida de workers:

- Rastreamento de criação/destruição de workers
- Visualização de mensagens trocadas
- Métricas de tempo em cada worker
- Estado atual de todos os workers

## Próximos Passos

- Aprimorar a transferência eficiente de dados usando `transferable objects`
- Implementar o monitoramento de performance em tempo real
- Adicionar suporte a Worker Pools para melhor gerenciamento de recursos

## Exemplo de Uso

```typescript
import { workerPool } from 'ts-bundler/workers';

// Criar um pool de workers
const pool = workerPool({
  size: 4, // número de workers
  task: (chunk) => processChunk(chunk)
});

// Dividir e processar dados
const chunks = splitData(largeData, 16);
const results = await pool.processAll(chunks);
```

Para visualizar o ciclo de vida dos workers, execute:

```bash
ts-bundler analyze-workers --watch
```
