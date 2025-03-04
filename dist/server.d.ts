import express from 'express';
import http from 'http';
import { BundleOptions } from './bundler';
export interface DevServerOptions {
    port?: number;
    host?: string;
    contentBase?: string;
    open?: boolean;
    proxy?: Record<string, string | {
        target: string;
        pathRewrite?: Record<string, string>;
    }>;
    middleware?: express.RequestHandler[];
    bundleOptions: BundleOptions;
}
export declare function startDevServer(options: DevServerOptions): Promise<http.Server>;
//# sourceMappingURL=server.d.ts.map