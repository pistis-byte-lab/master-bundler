export interface BundleOptions {
  /**
   * The entry point(s) for the bundle.  Can be a single string or an array of strings.
   * @default None (required)
   */
  input: string | string[];
  /**
   * The output directory for the bundled files.
   * @default './dist'
   */
  outDir?: string;
  /**
   * The output format(s) for the bundled files.  Can be a single format or an array of formats.
   * Supported formats: 'esm', 'cjs', 'umd'
   * @default ['esm', 'cjs', 'umd']
   */
  format?: 'esm' | 'cjs' | 'umd' | ('esm' | 'cjs' | 'umd')[];
  /**
   * Whether to minify the bundled files.
   * @default false
   */
  minify?: boolean;
  /**
   * Whether to generate source maps for the bundled files.
   * @default false
   */
  sourcemap?: boolean;
  /**
   * The target environment(s) for the bundled files. Can be a single string or an array of strings.
   *  Examples: 'esnext', 'es5', 'es2015'
   * @default ['esnext']
   */
  target?: string | string[];
  /**
   * An array of external dependencies.  These dependencies will not be included in the bundle.
   * @default []
   */
  external?: string[];
  /**
   * A mapping of global variables to use for external dependencies.
   * @default {}
   */
  globals?: Record<string, string>;
  /**
   * The bundling strategy to use.
   *  //Further documentation of BundlingStrategyType is needed here.
   */
  strategy?: BundlingStrategyType;
}

//This section needs to be added to complete the code.  The type BundlingStrategyType is undefined in the provided snippet.  A placeholder is used.
type BundlingStrategyType = 'strategyA' | 'strategyB';