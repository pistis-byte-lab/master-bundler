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
const manager_1 = require("./plugins/manager");
const progress_1 = require("./utils/progress");
const path_1 = __importDefault(require("path"));
async function transformCode(code, filePath, options) {
    const progress = (0, progress_1.createProgress)({
        message: `Transforming ${path_1.default.basename(filePath)}`,
        total: manager_1.pluginManager.getPlugins().length + 1
    });
    const context = {
        options,
        filePath,
        content: code
    };
    let result = context;
    let currentStep = 0;
    try {
        progress.update({ current: ++currentStep, message: 'Running pre-transform hooks' });
        result = await manager_1.pluginManager.executeHook('beforeTransform', result);
        progress.update({ current: ++currentStep, message: 'Applying transformations' });
        result = await manager_1.pluginManager.executeHook('transform', result);
        progress.update({ current: ++currentStep, message: 'Running post-transform hooks' });
        result = await manager_1.pluginManager.executeHook('afterTransform', result);
        progress.complete('Transformation completed');
        return result.content;
    }
    catch (error) {
        progress.fail('Transformation failed');
        throw error;
    }
}
async function bundle(options) {
    var _a;
    const { input, format = 'esm', minify = true, sourcemap = true, name, external = [], globals = {}, outDir: userOutDir, chunkFileNames = '[name]-[hash].js', manualChunks, } = options;
    const progress = (0, progress_1.createProgress)({
        message: 'Starting bundling process',
        total: 100
    });
    try {
        progress.update({ current: 10, message: 'Setting up plugins' });
        await manager_1.pluginManager.executeHook('setup', options);
        const resolvedInput = (0, paths_1.resolveInput)(input);
        const outputPath = (0, paths_1.getOutputPath)(resolvedInput, format, userOutDir);
        const outputDir = path_1.default.dirname(outputPath);
        progress.update({ current: 20, message: 'Configuring Rollup' });
        const outputOptions = {
            file: outputPath,
            format,
            name,
            sourcemap,
            globals,
            chunkFileNames,
            manualChunks,
        };
        const rollupOptions = {
            input: resolvedInput,
            external,
            output: outputOptions,
            plugins: [
                {
                    name: 'ts-bundler-plugins',
                    async transform(code, id) {
                        if (id.endsWith('.ts') || id.endsWith('.tsx')) {
                            return await transformCode(code, id, options);
                        }
                        return null;
                    }
                },
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
        progress.update({ current: 40, message: 'Creating bundle' });
        const bundle = await (0, rollup_1.rollup)(rollupOptions);
        progress.update({ current: 60, message: `Writing output to: ${outputPath}` });
        logger_1.logger.info(`Writing output to: ${outputPath}`);
        const output = await bundle.write(outputOptions);
        progress.update({ current: 80, message: 'Cleaning up' });
        await bundle.close();
        progress.update({ current: 90, message: 'Running plugin cleanup' });
        await manager_1.pluginManager.executeHook('cleanup', null);
        progress.complete('Bundle completed successfully');
        return {
            code: output.output[0].code,
            map: (_a = output.output[0].map) === null || _a === void 0 ? void 0 : _a.toString(),
            declarations: output.output[0].fileName,
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        progress.fail(`Bundle failed: ${errorMessage}`);
        logger_1.logger.error(`Bundle failed: ${errorMessage}`);
        throw error;
    }
}
//# sourceMappingURL=bundler.js.map