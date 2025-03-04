import { BundleOptions } from './types';
interface WatchOptions extends BundleOptions {
    watchDir?: string;
}
export declare class Watcher {
    private watcher;
    private options;
    private rebuilding;
    private lastState;
    private changeTimeout;
    constructor(options: WatchOptions);
    private waitForFileStability;
    private rebuild;
    start(): Promise<void>;
    stop(): Promise<void>;
}
export {};
//# sourceMappingURL=watcher.d.ts.map