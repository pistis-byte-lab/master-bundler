export interface BundleOptions {
  input: string;
  output?: string;
  outDir?: string;
  format?: 'esm' | 'umd' | 'cjs';
  name?: string;
  minify?: boolean;
  sourcemap?: boolean;
  target?: string[];
  external?: string[];
  globals?: Record<string, string>;
  progress?: boolean;
  chunkFileNames?: string;
  manualChunks?: Record<string, string[]> | ((id: string) => string | null | undefined);
}

export interface BuildResult {
  code: string;
  map?: string;
  declarations?: string;
}

export interface CliFlags {
  watch?: boolean;
  format?: string;
  minify?: boolean;
  sourcemap?: boolean;
  outDir?: string;
  watchDir?: string;
  progress?: boolean;
  chunkFileNames?: string;
}
export interface BundleOptions {
  input: string | string[];
  output?: string;
  outDir?: string;
  format?: 'esm' | 'cjs' | 'umd';
  name?: string;
  minify?: boolean;
  sourcemap?: boolean;
  target?: string | string[];
  external?: string[];
  globals?: Record<string, string>;
  watch?: boolean;
  watchDir?: string;
  progress?: boolean;
  chunkFileNames?: string;
  liveReload?: boolean;
  plugins?: string[];
  pluginConfigPath?: string;
  pluginOptions?: Record<string, any>;
  watchMode?: boolean;
}

export interface BuildResult {
  outputFiles: string[];
  duration: number;
  size: number;
  errors: Error[];
  warnings: string[];
}

export interface ProgressUpdate {
  stage: 'start' | 'resolve' | 'transform' | 'bundle' | 'write' | 'complete';
  message?: string;
  progress: number; // 0-100
  total?: number;
  processed?: number;
}

export interface Dependency {
  path: string;
  type: 'static' | 'dynamic';
  external: boolean;
}

export interface ModuleMetadata {
  id: string;
  dependencies: Dependency[];
  exports: string[];
  size: number;
  code?: string;
  map?: any;
}

export interface Asset {
  name: string;
  source: string | Buffer;
  type: string;
  size: number;
}
