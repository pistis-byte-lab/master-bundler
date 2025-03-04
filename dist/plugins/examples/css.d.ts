import { Plugin, PluginContext } from '../types';
export declare class CSSPlugin implements Plugin {
    name: string;
    private postcssProcessor;
    constructor();
    setup(options: any): void;
    transform(context: PluginContext): Promise<string>;
    cleanup(): void;
}
//# sourceMappingURL=css.d.ts.map