import { bundle } from '../src/bundler';
import path from 'path';
import fs from 'fs';

describe('Code Splitting', () => {
  const fixtureDir = path.join(process.cwd(), 'test-fixtures');
  const outputDir = path.join(fixtureDir, 'dist');

  beforeAll(() => {
    // Clean up and create test directories
    if (fs.existsSync(fixtureDir)) {
      fs.rmSync(fixtureDir, { recursive: true, force: true });
    }
    fs.mkdirSync(fixtureDir, { recursive: true });

    // Create test files
    fs.writeFileSync(
      path.join(fixtureDir, 'main.ts'),
      `
        import('./module1').then(m => console.log(m.hello));
        import('./module2').then(m => console.log(m.world));
      `
    );

    fs.writeFileSync(
      path.join(fixtureDir, 'module1.ts'),
      'export const hello = "Hello";'
    );

    fs.writeFileSync(
      path.join(fixtureDir, 'module2.ts'),
      'export const world = "World";'
    );
  });

  afterAll(() => {
    if (fs.existsSync(fixtureDir)) {
      fs.rmSync(fixtureDir, { recursive: true, force: true });
    }
  });

  it('should create separate chunks for dynamic imports', async () => {
    const input = path.join(fixtureDir, 'main.ts');
    const result = await bundle({
      input,
      format: 'esm',
      outDir: outputDir,
      chunkFileNames: '[name]-[hash].js'
    });

    // Verify main bundle exists
    expect(fs.existsSync(path.join(outputDir, 'main.esm.mjs'))).toBe(true);

    // Check for chunk files
    const files = fs.readdirSync(outputDir);
    const chunkFiles = files.filter(f => f.match(/module[12]-[a-f0-9]+\.js$/));
    expect(chunkFiles.length).toBe(2);

    // Verify chunk contents
    const chunk1Content = fs.readFileSync(
      path.join(outputDir, chunkFiles.find(f => f.includes('module1'))!),
      'utf-8'
    );
    expect(chunk1Content).toContain('hello');

    const chunk2Content = fs.readFileSync(
      path.join(outputDir, chunkFiles.find(f => f.includes('module2'))!),
      'utf-8'
    );
    expect(chunk2Content).toContain('world');
  });

  it('should support manual chunk configuration', async () => {
    const input = path.join(fixtureDir, 'main.ts');
    const result = await bundle({
      input,
      format: 'esm',
      outDir: outputDir,
      chunkFileNames: '[name]-[hash].js',
      manualChunks: {
        'vendor': ['module1.ts', 'module2.ts']
      }
    });

    // Verify vendor chunk exists
    const files = fs.readdirSync(outputDir);
    const vendorChunk = files.find(f => f.match(/vendor-[a-f0-9]+\.js$/));
    expect(vendorChunk).toBeDefined();

    // Check vendor chunk content
    const vendorContent = fs.readFileSync(
      path.join(outputDir, vendorChunk!),
      'utf-8'
    );
    expect(vendorContent).toContain('hello');
    expect(vendorContent).toContain('world');
  });
});
