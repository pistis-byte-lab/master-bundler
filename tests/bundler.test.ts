import { bundle } from '../src/bundler';
import fs from 'fs';
import path from 'path';

describe('bundler', () => {
  const fixtureDir = path.join(process.cwd(), 'test-fixtures');
  const testFile = path.join(fixtureDir, 'input.ts');
  const outputDir = path.join(fixtureDir, 'dist');

  beforeAll(async () => {
    // Clean up existing test files
    if (fs.existsSync(fixtureDir)) {
      fs.rmSync(fixtureDir, { recursive: true, force: true });
    }

    // Create test fixture directory and file
    fs.mkdirSync(fixtureDir, { recursive: true });
    fs.writeFileSync(testFile, 'export const hello = "world";');

    // Create output directory
    fs.mkdirSync(outputDir, { recursive: true });

    // Wait for file operations to complete
    await new Promise(resolve => setTimeout(resolve, 200));
  });

  afterAll(async () => {
    try {
      if (fs.existsSync(fixtureDir)) {
        fs.rmSync(fixtureDir, { recursive: true, force: true });
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  });

  it('should bundle TypeScript file', async () => {
    expect(fs.existsSync(testFile)).toBe(true);

    const result = await bundle({
      input: testFile,
      format: 'esm',
      outDir: outputDir,
    });

    expect(result.code).toBeDefined();
    expect(result.code).toContain('world');
  }, 15000);

  it('should generate source maps when enabled', async () => {
    expect(fs.existsSync(testFile)).toBe(true);

    const result = await bundle({
      input: testFile,
      format: 'esm',
      sourcemap: true,
      outDir: outputDir,
    });

    expect(result.map).toBeDefined();
  }, 15000);
});