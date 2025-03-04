
import { parentPort, isMainThread } from 'worker_threads';

if (isMainThread) {
  throw new Error('Este script deve ser executado como um worker thread');
}

if (!parentPort) {
  throw new Error('O parentPort não está disponível');
}

// Receber mensagens do thread principal
parentPort.on('message', async (message) => {
  const { data, filename, taskId } = message;
  
  try {
    // Executar a tarefa
    let result;
    
    // Se o arquivo de processamento for fornecido, importá-lo dinamicamente
    if (filename) {
      const processor = await import(filename);
      result = await processor.default(data);
    } else {
      // Caso contrário, assumir que os dados já contêm uma função para executar
      if (typeof data.process === 'function') {
        result = await data.process(data.input, data.options);
      } else {
        throw new Error('Nenhum processador válido foi fornecido');
      }
    }
    
    // Enviar o resultado de volta para o thread principal
    parentPort!.postMessage({ result, taskId });
  } catch (error) {
    // Enviar o erro de volta para o thread principal
    parentPort!.postMessage({ 
      error: { 
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      }, 
      taskId 
    });
  }
});

// Notificar que o worker está pronto
parentPort.postMessage({ type: 'ready' });
