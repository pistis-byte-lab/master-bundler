"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bundle = bundle;
const rollup_1 = require("rollup");
const plugin_typescript_1 = __importDefault(require("@rollup/plugin-typescript"));
const plugin_node_resolve_1 = __importDefault(require("@rollup/plugin-node-resolve"));
const plugin_commonjs_1 = __importDefault(require("@rollup/plugin-commonjs"));
const rollup_plugin_terser_1 = require("rollup-plugin-terser");
const paths_1 = require("./utils/paths");
const logger_1 = require("./utils/logger");
const path_1 = __importDefault(require("path"));
async function bundle(options) {
    var _a;
    const { input, format = 'esm', minify = true, sourcemap = true, name, external = [], globals = {}, outDir: userOutDir, } = options;
    try {
        const resolvedInput = (0, paths_1.resolveInput)(input);
        const outputPath = (0, paths_1.getOutputPath)(resolvedInput, format, userOutDir);
        const outputDir = path_1.default.dirname(outputPath);
        // Configure Rollup
        const rollupOptions = {
            input: resolvedInput,
            external,
            plugins: [
                (0, plugin_typescript_1.default)({
                    tsconfig: 'tsconfig.json',
                    declaration: true,
                    outDir: outputDir,
                    moduleResolution: 'node',
                    compilerOptions: {
                        module: 'esnext',
                        target: 'es2019',
                        sourceMap: sourcemap,
                    },
                }),
                (0, plugin_node_resolve_1.default)({
                    extensions: ['.ts', '.js'],
                    preferBuiltins: true,
                }),
                (0, plugin_commonjs_1.default)(),
                minify && (0, rollup_plugin_terser_1.terser)(),
            ].filter(Boolean),
        };
        const bundle = await (0, rollup_1.rollup)(rollupOptions);
        logger_1.logger.info(`Writing output to: ${outputPath}`);
        const output = await bundle.write({
            file: outputPath,
            format,
            name,
            sourcemap,
            globals,
        });
        await bundle.close();
        return {
            code: output.output[0].code,
            map: (_a = output.output[0].map) === null || _a === void 0 ? void 0 : _a.toString(),
            declarations: output.output[0].fileName,
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger_1.logger.error(`Bundle failed: ${errorMessage}`);
        throw error;
    }
}
//# sourceMappingURL=bundler.js.map