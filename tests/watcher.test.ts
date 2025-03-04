import { Watcher } from '../src/watcher';
import fs from 'fs';
import path from 'path';
import { logger } from '../src/utils/logger';

describe('watcher', () => {
  const fixtureDir = path.join(process.cwd(), 'test-fixtures');
  const testFile = path.join(fixtureDir, 'input.ts');
  const outputDir = path.join(fixtureDir, 'dist');
  let watcher: Watcher | undefined;

  const waitForFileStability = async (filePath: string, timeout = 5000, interval = 100): Promise<boolean> => {
    const start = Date.now();
    let lastStats: fs.Stats | null = null;
    let stableCount = 0;

    while (Date.now() - start < timeout) {
      if (fs.existsSync(filePath)) {
        try {
          const stats = fs.statSync(filePath);
          if (lastStats && 
              stats.size === lastStats.size && 
              stats.mtime.getTime() === lastStats.mtime.getTime()) {
            stableCount++;
            if (stableCount >= 3) {
              logger.info(`File ${filePath} is stable`);
              return true;
            }
          } else {
            stableCount = 0;
            lastStats = stats;
          }
          logger.info(`File check - mtime: ${stats.mtime.toISOString()}, size: ${stats.size} bytes`);
        } catch (error) {
          logger.error(`Error checking file: ${error}`);
          stableCount = 0;
        }
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    logger.warning(`Timeout waiting for file stability: ${filePath}`);
    return false;
  };

  const verifyFileContent = async (filePath: string, expectedContent: string, timeout = 15000): Promise<boolean> => {
    const start = Date.now();
    logger.info(`Verifying content in: ${filePath}`);
    logger.info(`Expected content: ${expectedContent}`);

    while (Date.now() - start < timeout) {
      if (fs.existsSync(filePath)) {
        try {
          const stats = fs.statSync(filePath);
          const content = fs.readFileSync(filePath, 'utf-8');
          logger.info(`Content check - mtime: ${stats.mtime.toISOString()}, size: ${stats.size} bytes`);
          logger.info(`Current content: ${content}`);
          if (content.includes(expectedContent)) {
            logger.info('Found expected content!');
            return true;
          }
        } catch (error) {
          logger.error(`Error reading file: ${error}`);
        }
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    logger.warning(`Timeout waiting for content in: ${filePath}`);
    return false;
  };

  beforeAll(async () => {
    // Clean up existing test files
    if (fs.existsSync(fixtureDir)) {
      fs.rmSync(fixtureDir, { recursive: true, force: true });
    }

    // Create test fixture directory and file
    fs.mkdirSync(fixtureDir, { recursive: true });
    fs.writeFileSync(testFile, 'export const hello = "world";');
    fs.mkdirSync(outputDir, { recursive: true });

    // Wait for file operations to complete
    await new Promise(resolve => setTimeout(resolve, 2000));
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

  afterEach(async () => {
    if (watcher) {
      logger.info('Stopping watcher after test...');
      await watcher.stop();
      watcher = undefined;
      await new Promise(resolve => setTimeout(resolve, 2000));
      logger.info('Watcher stopped successfully');
    }
  });

  it('should watch for file changes', async () => {
    watcher = new Watcher({
      input: testFile,
      format: 'esm',
      outDir: outputDir,
      watchDir: fixtureDir
    });

    await watcher.start();
    logger.info('Watcher started successfully');

    const outputFile = path.join(outputDir, 'input.esm.mjs');
    logger.info(`Expected output file: ${outputFile}`);

    // Verify initial build
    logger.info('Verifying initial build...');
    const initialFileStable = await waitForFileStability(outputFile, 10000);
    expect(initialFileStable).toBe(true);

    const initialContent = fs.readFileSync(outputFile, 'utf-8');
    expect(initialContent).toContain('world');
    logger.info('Initial build verified successfully');

    // Wait before modifying the file
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Modify the file
    logger.info('Writing updated content to test file...');
    fs.writeFileSync(testFile, 'export const hello = "updated";');

    // Verify the file was written
    const fileStats = fs.statSync(testFile);
    logger.info(`Updated file stats - mtime: ${fileStats.mtime.toISOString()}, size: ${fileStats.size} bytes`);
    logger.info(`Updated file content: ${fs.readFileSync(testFile, 'utf-8')}`);

    // Wait for the file to be regenerated with new content
    logger.info('Waiting for output file to be updated...');
    const contentUpdated = await verifyFileContent(outputFile, 'updated', 30000);
    logger.info(`Output directory contents: ${fs.readdirSync(outputDir).join(', ')}`);

    expect(contentUpdated).toBe(true);
    const finalContent = fs.readFileSync(outputFile, 'utf-8');
    expect(finalContent).toContain('updated');
  }, 60000); // Increased timeout to 60 seconds
});