import { BaseTransformer, TransformContext } from './base';
import * as ts from 'typescript';
interface TypeScriptTransformerOptions {
    compilerOptions?: ts.CompilerOptions;
    tsconfigPath?: string;
    strict?: boolean;
}
/**
 * TypeScript transformer
 */
export declare class TypeScriptTransformer extends BaseTransformer {
    private compilerOptions;
    constructor(options?: TypeScriptTransformerOptions);
    private loadTsConfig;
    transform(context: TransformContext): Promise<TransformContext>;
    private createVirtualProgram;
    private getDiagnostics;
}
export {};
//# sourceMappingURL=typescript.d.ts.map