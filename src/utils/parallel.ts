
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import path from 'path';
import { logger } from './logger';
import os from 'os';

interface WorkerTask<T, R> {
  id: number;
  data: T;
  filename: string;
  methodName: string;
}

interface WorkerResult<R> {
  id: number;
  result: R;
  error?: Error;
}

export class ParallelProcessor {
  private workers: Worker[] = [];
  private taskQueue: WorkerTask<any, any>[] = [];
  private taskCallbacks: Map<number, { resolve: (value: any) => void, reject: (reason?: any) => void }> = new Map();
  private taskCounter = 0;
  private isProcessing = false;

  constructor(private maxWorkers = Math.max(1, os.cpus().length - 1)) {
    logger.debug(`Initialized parallel processor with ${this.maxWorkers} workers`);
  }

  public async process<T, R>(tasks: T[], processorFile: string, methodName: string): Promise<R[]> {
    if (tasks.length === 0) {
      return [];
    }

    const results: R[] = new Array(tasks.length);
    const promises: Promise<void>[] = [];

    for (let i = 0; i < tasks.length; i++) {
      const promise = new Promise<void>((resolve, reject) => {
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

  private startProcessing(): void {
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

  private processNextTasks(): void {
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
      if (!(worker as any).processing) {
        const task = this.taskQueue.shift()!;
        (worker as any).processing = true;
        
        worker.postMessage(task);
      }
    }
  }

  private createWorker(): void {
    const worker = new Worker(path.join(__dirname, 'worker.js'));
    
    worker.on('message', (result: WorkerResult<any>) => {
      const callback = this.taskCallbacks.get(result.id);
      
      if (callback) {
        if (result.error) {
          callback.reject(new Error(result.error.message));
        } else {
          callback.resolve(result.result);
        }
        
        this.taskCallbacks.delete(result.id);
      }
      
      // Mark worker as available
      (worker as any).processing = false;
      
      // Process next tasks
      this.processNextTasks();
    });
    
    worker.on('error', (err) => {
      logger.error('Worker error:', err);
      
      // Recreate the worker
      this.workers = this.workers.filter(w => w !== worker);
      this.createWorker();
      
      // Process next tasks
      (worker as any).processing = false;
      this.processNextTasks();
    });
    
    this.workers.push(worker);
  }

  public async shutdown(): Promise<void> {
    logger.debug('Shutting down parallel processor...');
    
    const shutdownPromises = this.workers.map(worker => {
      return new Promise<void>((resolve) => {
        worker.on('exit', () => resolve());
        worker.terminate();
      });
    });
    
    this.workers = [];
    await Promise.all(shutdownPromises);
    
    logger.debug('Parallel processor shutdown complete');
  }
}

// Worker script (to be saved as worker.js)
export function workerScript(): string {
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
