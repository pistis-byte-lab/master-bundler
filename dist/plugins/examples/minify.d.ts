import { Plugin, PluginContext } from '../types';
export declare class MinifyPlugin implements Plugin {
    name: string;
    setup(options: any): void;
    transform(context: PluginContext): Promise<string>;
    cleanup(): void;
}
//# sourceMappingURL=minify.d.ts.map