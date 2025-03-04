
import { BaseTransformer, TransformContext } from './base';
import * as ts from 'typescript';
import { logger } from '../utils/logger';
import fs from 'fs';
import path from 'path';

interface TypeScriptTransformerOptions {
  compilerOptions?: ts.CompilerOptions;
  tsconfigPath?: string;
  strict?: boolean;
}

/**
 * TypeScript transformer
 */
export class TypeScriptTransformer extends BaseTransformer {
  private compilerOptions: ts.CompilerOptions;
  
  constructor(options: TypeScriptTransformerOptions = {}) {
    super({
      name: 'typescript',
      extensions: ['.ts', '.tsx']
    });
    
    // Load tsconfig if provided
    if (options.tsconfigPath) {
      this.compilerOptions = this.loadTsConfig(options.tsconfigPath);
    } else {
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
  
  private loadTsConfig(tsconfigPath: string): ts.CompilerOptions {
    try {
      const configPath = path.isAbsolute(tsconfigPath)
        ? tsconfigPath
        : path.resolve(process.cwd(), tsconfigPath);
      
      if (!fs.existsSync(configPath)) {
        logger.warn(`TypeScript config file not found: ${configPath}`);
        return {};
      }
      
      const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
      
      if (configFile.error) {
        throw new Error(`Error reading tsconfig: ${configFile.error.messageText}`);
      }
      
      const parsedConfig = ts.parseJsonConfigFileContent(
        configFile.config,
        ts.sys,
        path.dirname(configPath)
      );
      
      if (parsedConfig.errors && parsedConfig.errors.length > 0) {
        throw new Error(`Error parsing tsconfig: ${parsedConfig.errors[0].messageText}`);
      }
      
      return parsedConfig.options;
    } catch (error) {
      logger.error(`Failed to load TypeScript config:`, error);
      return {};
    }
  }
  
  async transform(context: TransformContext): Promise<TransformContext> {
    const { filePath, content, options = {} } = context;
    
    // Merge transformer options with context options
    const compilerOptions = {
      ...this.compilerOptions,
      ...options.compilerOptions
    };
    
    // Create a virtual file system and compiler host
    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      compilerOptions.target || ts.ScriptTarget.ES2019,
      true
    );
    
    // Perform syntactic and semantic diagnostics
    const program = this.createVirtualProgram(sourceFile, compilerOptions);
    const diagnostics = this.getDiagnostics(program, sourceFile);
    
    if (diagnostics.length > 0) {
      const formatHost: ts.FormatDiagnosticsHost = {
        getCanonicalFileName: path => path,
        getCurrentDirectory: ts.sys.getCurrentDirectory,
        getNewLine: () => ts.sys.newLine
      };
      
      const formattedDiagnostics = ts.formatDiagnosticsWithColorAndContext(
        diagnostics,
        formatHost
      );
      
      logger.warn('TypeScript diagnostics:');
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
  
  private createVirtualProgram(
    sourceFile: ts.SourceFile,
    compilerOptions: ts.CompilerOptions
  ): ts.Program {
    const fileMap = new Map<string, ts.SourceFile>();
    fileMap.set(sourceFile.fileName, sourceFile);
    
    const compilerHost: ts.CompilerHost = {
      getSourceFile: (fileName) => fileMap.get(fileName),
      getDefaultLibFileName: () => 'lib.d.ts',
      writeFile: () => {},
      getCurrentDirectory: () => process.cwd(),
      getDirectories: () => [],
      fileExists: (fileName) => fileMap.has(fileName) || ts.sys.fileExists(fileName),
      readFile: (fileName) => fileMap.has(fileName) 
        ? fileMap.get(fileName)!.text 
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
  
  private getDiagnostics(program: ts.Program, sourceFile: ts.SourceFile): ts.Diagnostic[] {
    const syntacticDiagnostics = program.getSyntacticDiagnostics(sourceFile);
    const semanticDiagnostics = program.getSemanticDiagnostics(sourceFile);
    
    return [...syntacticDiagnostics, ...semanticDiagnostics];
  }
}
