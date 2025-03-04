export interface ProgressOptions {
    total?: number;
    current?: number;
    message?: string;
    status?: 'pending' | 'success' | 'error';
}
export declare class ProgressIndicator {
    private total;
    private current;
    private startTime;
    private message;
    private status;
    constructor(options?: ProgressOptions);
    update(options: ProgressOptions): void;
    private getProgressBar;
    private getTimeEstimate;
    private getStatusColor;
    private render;
    complete(message?: string): void;
    fail(message?: string): void;
}
export declare const createProgress: (options?: ProgressOptions) => ProgressIndicator;
//# sourceMappingURL=progress.d.ts.map