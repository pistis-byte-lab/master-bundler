import path from 'path';
import fs from 'fs';
import { logger } from './logger';

export function resolveInput(input: string): string {
  const absolutePath = path.isAbsolute(input) ? input : path.resolve(process.cwd(), input);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Input file not found: ${absolutePath}`);
  }

  return absolutePath;
}

export function getOutputPath(input: string, format: string, outDir?: string): string {
  const inputName = path.basename(input, path.extname(input));
  const ext = format === 'esm' ? '.mjs' : '.js';

  // Use provided outDir or default to input file's directory + 'dist'
  const resolvedOutDir = outDir 
    ? path.resolve(outDir)
    : path.resolve(path.dirname(input), 'dist');

  // Ensure output directory exists
  fs.mkdirSync(resolvedOutDir, { recursive: true });

  return path.join(resolvedOutDir, `${inputName}.${format}${ext}`);
}

export function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function normalizeInputPath(input: string): string {
  return path.normalize(input).replace(/\\/g, '/');
}