"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParallelProcessor = void 0;
exports.workerScript = workerScript;
const worker_threads_1 = require("worker_threads");
const path_1 = __importDefault(require("path"));
const logger_1 = require("./logger");
const os_1 = __importDefault(require("os"));
class ParallelProcessor {
    constructor(maxWorkers = Math.max(1, os_1.default.cpus().length - 1)) {
        this.maxWorkers = maxWorkers;
        this.workers = [];
        this.taskQueue = [];
        this.taskCallbacks = new Map();
        this.taskCounter = 0;
        this.isProcessing = false;
        logger_1.logger.debug(`Initialized parallel processor with ${this.maxWorkers} workers`);
    }
    async process(tasks, processorFile, methodName) {
        if (tasks.length === 0) {
            return [];
        }
        const results = new Array(tasks.length);
        const promises = [];
        for (let i = 0; i < tasks.length; i++) {
            const promise = new Promise((resolve, reject) => {
                const taskId = this.taskCounter++;
                this.taskCallbacks.set(taskId, {
                    resolve: (result) => {
                        results[i] = result;
                        resolve();
                    },
                    reject
                });
                this.taskQueue.push({
                    id: taskId,
                    data: tasks[i],
                    filename: processorFile,
                    methodName
                });
            });
            promises.push(promise);
        }
        this.startProcessing();
        await Promise.all(promises);
        return results;
    }
    startProcessing() {
        if (this.isProcessing) {
            return;
        }
        this.isProcessing = true;
        // Create workers if needed
        if (this.workers.length === 0) {
            for (let i = 0; i < this.maxWorkers; i++) {
                this.createWorker();
            }
        }
        // Start processing the queue
        this.processNextTasks();
    }
    processNextTasks() {
        // If all tasks are done, stop processing
        if (this.taskQueue.length === 0) {
            this.isProcessing = false;
            return;
        }
        // Assign tasks to available workers
        for (const worker of this.workers) {
            if (this.taskQueue.length === 0) {
                break;
            }
            // Check if the worker is busy (has a 'processing' property)
            if (!worker.processing) {
                const task = this.taskQueue.shift();
                worker.processing = true;
                worker.postMessage(task);
            }
        }
    }
    createWorker() {
        const worker = new worker_threads_1.Worker(path_1.default.join(__dirname, 'worker.js'));
        worker.on('message', (result) => {
            const callback = this.taskCallbacks.get(result.id);
            if (callback) {
                if (result.error) {
                    callback.reject(new Error(result.error.message));
                }
                else {
                    callback.resolve(result.result);
                }
                this.taskCallbacks.delete(result.id);
            }
            // Mark worker as available
            worker.processing = false;
            // Process next tasks
            this.processNextTasks();
        });
        worker.on('error', (err) => {
            logger_1.logger.error('Worker error:', err);
            // Recreate the worker
            this.workers = this.workers.filter(w => w !== worker);
            this.createWorker();
            // Process next tasks
            worker.processing = false;
            this.processNextTasks();
        });
        this.workers.push(worker);
    }
    async shutdown() {
        logger_1.logger.debug('Shutting down parallel processor...');
        const shutdownPromises = this.workers.map(worker => {
            return new Promise((resolve) => {
                worker.on('exit', () => resolve());
                worker.terminate();
            });
        });
        this.workers = [];
        await Promise.all(shutdownPromises);
        logger_1.logger.debug('Parallel processor shutdown complete');
    }
}
exports.ParallelProcessor = ParallelProcessor;
// Worker script (to be saved as worker.js)
function workerScript() {
    return `
const { parentPort, workerData } = require('worker_threads');

parentPort.on('message', async (task) => {
  try {
    // Dynamically import the processor file
    const module = require(task.filename);
    
    // Get the processor method
    const method = module[task.methodName];
    
    if (typeof method !== 'function') {
      throw new Error(\`Method \${task.methodName} not found in \${task.filename}\`);
    }
    
    // Execute the method
    const result = await method(task.data);
    
    // Send back the result
    parentPort.postMessage({
      id: task.id,
      result
    });
  } catch (error) {
    parentPort.postMessage({
      id: task.id,
      error: {
        message: error.message,
        stack: error.stack
      }
    });
  }
});
  `;
}
//# sourceMappingURL=parallel.js.map