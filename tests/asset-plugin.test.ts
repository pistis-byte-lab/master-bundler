import { AssetPlugin } from '../src/plugins/examples/assets';
import { PluginContext } from '../src/plugins/types';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import crypto from 'crypto';

describe('Asset Plugin', () => {
  const fixtureDir = path.join(process.cwd(), 'test-fixtures');
  const assetDir = path.join(fixtureDir, 'assets');
  const outputDir = path.join(fixtureDir, 'dist');
  let assetPlugin: AssetPlugin;

  beforeAll(() => {
    // Clean up and create test directories
    if (fs.existsSync(fixtureDir)) {
      fs.rmSync(fixtureDir, { recursive: true, force: true });
    }
    fs.mkdirSync(assetDir, { recursive: true });
  });

  beforeEach(() => {
    assetPlugin = new AssetPlugin();
  });

  afterAll(() => {
    if (fs.existsSync(fixtureDir)) {
      fs.rmSync(fixtureDir, { recursive: true, force: true });
    }
  });

  it('should optimize images when configured', async () => {
    // Create a test image using sharp
    const testImage = path.join(assetDir, 'test.jpg');
    await sharp({
      create: {
        width: 2000,
        height: 2000,
        channels: 3,
        background: { r: 255, g: 0, b: 0 }
      }
    })
    .jpeg()
    .toFile(testImage);

    const context: PluginContext = {
      options: { input: 'test.ts', outDir: outputDir },
      filePath: testImage,
      content: '',
      config: {
        patterns: ['**/*.{jpg,jpeg,png}'],
        outputDir: path.join(outputDir, 'assets'),
        optimize: {
          images: true,
          quality: 80,
          maxWidth: 1000,
          maxHeight: 1000
        },
        fingerprint: {
          enabled: false
        }
      }
    };

    await assetPlugin.beforeTransform(context);

    const outputPath = path.join(outputDir, 'assets', 'test.jpg');
    expect(fs.existsSync(outputPath)).toBe(true);

    // Verify image was optimized
    const metadata = await sharp(outputPath).metadata();
    expect(metadata.width).toBeLessThanOrEqual(1000);
    expect(metadata.height).toBeLessThanOrEqual(1000);
  });

  it('should generate fingerprinted assets when enabled', async () => {
    const testImage = path.join(assetDir, 'fingerprint-test.png');
    const imageContent = 'test-image-content';
    fs.writeFileSync(testImage, imageContent);

    const expectedHash = crypto
      .createHash('md5')
      .update(imageContent)
      .digest('hex')
      .slice(0, 8);

    const context: PluginContext = {
      options: { input: 'test.ts', outDir: outputDir },
      filePath: testImage,
      content: imageContent,
      config: {
        patterns: ['**/*.png'],
        outputDir: path.join(outputDir, 'assets'),
        fingerprint: {
          enabled: true,
          algorithm: 'md5',
          length: 8
        }
      }
    };

    await assetPlugin.beforeTransform(context);

    // Check if fingerprinted file exists
    const expectedPath = path.join(outputDir, 'assets', `fingerprint-test.${expectedHash}.png`);
    expect(fs.existsSync(expectedPath)).toBe(true);
    expect(fs.readFileSync(expectedPath, 'utf-8')).toBe(imageContent);
  });

  it('should generate manifest file with fingerprinted paths', async () => {
    const testImage = path.join(assetDir, 'manifest-test.jpg');
    fs.writeFileSync(testImage, 'test-content');

    const context: PluginContext = {
      options: { input: 'test.ts', outDir: outputDir },
      filePath: testImage,
      content: 'test-content',
      config: {
        patterns: ['**/*.jpg'],
        outputDir: path.join(outputDir, 'assets'),
        fingerprint: {
          enabled: true,
          algorithm: 'md5',
          length: 8,
          manifestPath: path.join(outputDir, 'test-manifest.json')
        }
      }
    };

    await assetPlugin.beforeTransform(context);
    assetPlugin.cleanup();

    const manifestPath = path.join(outputDir, 'test-manifest.json');
    expect(fs.existsSync(manifestPath)).toBe(true);

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    expect(Object.keys(manifest).length).toBeGreaterThan(0);
    expect(Object.values(manifest)[0]).toMatch(/manifest-test\.[a-f0-9]{8}\.jpg$/);
  });

  it('should copy font files without modification', async () => {
    const testFont = path.join(assetDir, 'test.woff2');
    const fontContent = 'fake-font-content';
    fs.writeFileSync(testFont, fontContent);

    const context: PluginContext = {
      options: { input: 'test.ts', outDir: outputDir },
      filePath: testFont,
      content: fontContent,
      config: {
        patterns: ['**/*.{woff,woff2,ttf,eot}'],
        outputDir: path.join(outputDir, 'assets')
      }
    };

    await assetPlugin.beforeTransform(context);

    const outputPath = path.join(outputDir, 'assets', 'test.woff2');
    expect(fs.existsSync(outputPath)).toBe(true);
    expect(fs.readFileSync(outputPath, 'utf-8')).toBe(fontContent);
  });

  it('should maintain font directory structure when flatten is false', async () => {
    const fontDir = path.join(assetDir, 'fonts');
    fs.mkdirSync(fontDir, { recursive: true });
    const testFont = path.join(fontDir, 'test.woff2');
    fs.writeFileSync(testFont, 'fake-font-content');

    const context: PluginContext = {
      options: { input: 'test.ts', outDir: outputDir },
      filePath: testFont,
      content: 'fake-font-content',
      config: {
        patterns: ['**/*.woff2'],
        outputDir: path.join(outputDir, 'assets'),
        flatten: false
      }
    };

    await assetPlugin.beforeTransform(context);

    const outputPath = path.join(outputDir, 'assets', 'fonts', 'test.woff2');
    expect(fs.existsSync(outputPath)).toBe(true);
  });

  it('should handle invalid font files gracefully', async () => {
    const testFont = path.join(assetDir, 'invalid.woff2');
    // Create an empty file
    fs.writeFileSync(testFont, '');

    const context: PluginContext = {
      options: { input: 'test.ts', outDir: outputDir },
      filePath: testFont,
      content: '',
      config: {
        patterns: ['**/*.woff2'],
        outputDir: path.join(outputDir, 'assets')
      }
    };

    await assetPlugin.beforeTransform(context);

    const outputPath = path.join(outputDir, 'assets', 'invalid.woff2');
    expect(fs.existsSync(outputPath)).toBe(true);
    expect(fs.readFileSync(outputPath, 'utf-8')).toBe('');
  });

  it('should ignore non-matching files', async () => {
    const testFile = path.join(assetDir, 'test.ts');
    fs.writeFileSync(testFile, 'export const test = true;');

    const context: PluginContext = {
      options: { input: 'test.ts', outDir: outputDir },
      filePath: testFile,
      content: 'export const test = true;',
      config: {
        patterns: ['**/*.{woff2,ttf}'],
        outputDir: path.join(outputDir, 'assets')
      }
    };

    const result = await assetPlugin.beforeTransform(context);
    expect(result).toBe(context.content);

    const outputPath = path.join(outputDir, 'assets', 'test.ts');
    expect(fs.existsSync(outputPath)).toBe(false);
  });
});