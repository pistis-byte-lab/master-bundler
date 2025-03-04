"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const worker_threads_1 = require("worker_threads");
if (worker_threads_1.isMainThread) {
    throw new Error('Este script deve ser executado como um worker thread');
}
if (!worker_threads_1.parentPort) {
    throw new Error('O parentPort não está disponível');
}
// Receber mensagens do thread principal
worker_threads_1.parentPort.on('message', async (message) => {
    const { data, filename, taskId } = message;
    try {
        // Executar a tarefa
        let result;
        // Se o arquivo de processamento for fornecido, importá-lo dinamicamente
        if (filename) {
            const processor = await Promise.resolve(`${filename}`).then(s => __importStar(require(s)));
            result = await processor.default(data);
        }
        else {
            // Caso contrário, assumir que os dados já contêm uma função para executar
            if (typeof data.process === 'function') {
                result = await data.process(data.input, data.options);
            }
            else {
                throw new Error('Nenhum processador válido foi fornecido');
            }
        }
        // Enviar o resultado de volta para o thread principal
        worker_threads_1.parentPort.postMessage({ result, taskId });
    }
    catch (error) {
        // Enviar o erro de volta para o thread principal
        worker_threads_1.parentPort.postMessage({
            error: {
                message: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
            },
            taskId
        });
    }
});
// Notificar que o worker está pronto
worker_threads_1.parentPort.postMessage({ type: 'ready' });
//# sourceMappingURL=worker.js.map