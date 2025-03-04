export interface SyntaxError {
    message: string;
    line?: number;
    column?: number;
    file?: string;
    code?: string;
    frame?: string;
}
export declare function formatSyntaxError(error: SyntaxError): string;
//# sourceMappingURL=error-handler.d.ts.map