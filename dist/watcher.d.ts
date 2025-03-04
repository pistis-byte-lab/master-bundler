import { BundleOptions } from './types';
interface WatchOptions extends BundleOptions {
    watchDir?: string;
}
export declare class Watcher {
    private watcher;
    private options;
    private rebuilding;
    private lastChange;
    private pendingChange;
    constructor(options: WatchOptions);
    private verifyFile;
    private processFileChange;
    start(): Promise<void>;
    stop(): Promise<void>;
}
export {};
//# sourceMappingURL=watcher.d.ts.map