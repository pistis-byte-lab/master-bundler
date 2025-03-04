import { Command } from 'commander';
import { DevServerOptions } from './server';
export interface DevServerCliOptions extends DevServerOptions {
    config?: string;
}
export declare function runDevServer(options?: Partial<DevServerCliOptions>): Promise<void>;
export declare function registerDevServerCommands(program: Command): void;
//# sourceMappingURL=cli.d.ts.map