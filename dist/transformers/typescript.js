"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypeScriptTransformer = void 0;
const base_1 = require("./base");
const ts = __importStar(require("typescript"));
const logger_1 = require("../utils/logger");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
/**
 * TypeScript transformer
 */
class TypeScriptTransformer extends base_1.BaseTransformer {
    constructor(options = {}) {
        super({
            name: 'typescript',
            extensions: ['.ts', '.tsx']
        });
        // Load tsconfig if provided
        if (options.tsconfigPath) {
            this.compilerOptions = this.loadTsConfig(options.tsconfigPath);
        }
        else {
            this.compilerOptions = options.compilerOptions || {
                target: ts.ScriptTarget.ES2019,
                module: ts.ModuleKind.ESNext,
                moduleResolution: ts.ModuleResolutionKind.NodeJs,
                esModuleInterop: true,
                strict: options.strict !== false,
                sourceMap: true,
                jsx: ts.JsxEmit.React
            };
        }
    }
    loadTsConfig(tsconfigPath) {
        try {
            const configPath = path_1.default.isAbsolute(tsconfigPath)
                ? tsconfigPath
                : path_1.default.resolve(process.cwd(), tsconfigPath);
            if (!fs_1.default.existsSync(configPath)) {
                logger_1.logger.warn(`TypeScript config file not found: ${configPath}`);
                return {};
            }
            const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
            if (configFile.error) {
                throw new Error(`Error reading tsconfig: ${configFile.error.messageText}`);
            }
            const parsedConfig = ts.parseJsonConfigFileContent(configFile.config, ts.sys, path_1.default.dirname(configPath));
            if (parsedConfig.errors && parsedConfig.errors.length > 0) {
                throw new Error(`Error parsing tsconfig: ${parsedConfig.errors[0].messageText}`);
            }
            return parsedConfig.options;
        }
        catch (error) {
            logger_1.logger.error(`Failed to load TypeScript config:`, error);
            return {};
        }
    }
    async transform(context) {
        const { filePath, content, options = {} } = context;
        // Merge transformer options with context options
        const compilerOptions = {
            ...this.compilerOptions,
            ...options.compilerOptions
        };
        // Create a virtual file system and compiler host
        const sourceFile = ts.createSourceFile(filePath, content, compilerOptions.target || ts.ScriptTarget.ES2019, true);
        // Perform syntactic and semantic diagnostics
        const program = this.createVirtualProgram(sourceFile, compilerOptions);
        const diagnostics = this.getDiagnostics(program, sourceFile);
        if (diagnostics.length > 0) {
            const formatHost = {
                getCanonicalFileName: path => path,
                getCurrentDirectory: ts.sys.getCurrentDirectory,
                getNewLine: () => ts.sys.newLine
            };
            const formattedDiagnostics = ts.formatDiagnosticsWithColorAndContext(diagnostics, formatHost);
            logger_1.logger.warn('TypeScript diagnostics:');
            console.warn(formattedDiagnostics);
        }
        // Compile TypeScript code
        const { outputText, sourceMapText } = ts.transpileModule(content, {
            compilerOptions,
            fileName: filePath,
            reportDiagnostics: true
        });
        // Update context with transformed content
        context.content = outputText;
        context.sourceMap = sourceMapText;
        context.extname = filePath.endsWith('.tsx') ? '.jsx' : '.js';
        return context;
    }
    createVirtualProgram(sourceFile, compilerOptions) {
        const fileMap = new Map();
        fileMap.set(sourceFile.fileName, sourceFile);
        const compilerHost = {
            getSourceFile: (fileName) => fileMap.get(fileName),
            getDefaultLibFileName: () => 'lib.d.ts',
            writeFile: () => { },
            getCurrentDirectory: () => process.cwd(),
            getDirectories: () => [],
            fileExists: (fileName) => fileMap.has(fileName) || ts.sys.fileExists(fileName),
            readFile: (fileName) => fileMap.has(fileName)
                ? fileMap.get(fileName).text
                : ts.sys.readFile(fileName),
            getCanonicalFileName: (fileName) => fileName,
            useCaseSensitiveFileNames: () => true,
            getNewLine: () => ts.sys.newLine,
            resolveModuleNames: (moduleNames, containingFile) => {
                return moduleNames.map(moduleName => {
                    return {
                        resolvedFileName: `${moduleName}.ts`,
                        isExternalLibraryImport: false
                    };
                });
            }
        };
        return ts.createProgram([sourceFile.fileName], compilerOptions, compilerHost);
    }
    getDiagnostics(program, sourceFile) {
        const syntacticDiagnostics = program.getSyntacticDiagnostics(sourceFile);
        const semanticDiagnostics = program.getSemanticDiagnostics(sourceFile);
        return [...syntacticDiagnostics, ...semanticDiagnostics];
    }
}
exports.TypeScriptTransformer = TypeScriptTransformer;
//# sourceMappingURL=typescript.js.map