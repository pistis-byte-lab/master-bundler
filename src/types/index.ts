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