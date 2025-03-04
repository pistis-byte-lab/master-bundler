export interface DevServerOptions {
    port: number;
    contentBase: string;
    liveReload: boolean;
    overlay: boolean;
    proxy?: Record<string, string>;
    open?: boolean;
    hostname?: string;
}
export declare class DevServer {
    private app;
    private server;
    private wss;
    private options;
    private watcher;
    constructor(options?: Partial<DevServerOptions>);
    private setupMiddleware;
    private setupWebSocket;
    private injectLiveReloadScript;
    private watchFiles;
    private notifyClients;
    start(): Promise<void>;
    stop(): Promise<void>;
}
export declare function createDevServer(options?: Partial<DevServerOptions>): DevServer;
//# sourceMappingURL=server.d.ts.map