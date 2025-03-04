export declare class ParallelProcessor {
    private maxWorkers;
    private workers;
    private taskQueue;
    private taskCallbacks;
    private taskCounter;
    private isProcessing;
    constructor(maxWorkers?: number);
    process<T, R>(tasks: T[], processorFile: string, methodName: string): Promise<R[]>;
    private startProcessing;
    private processNextTasks;
    private createWorker;
    shutdown(): Promise<void>;
}
export declare function workerScript(): string;
//# sourceMappingURL=parallel.d.ts.map