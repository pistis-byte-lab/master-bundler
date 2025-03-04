import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { logger } from '../src/utils/logger';

const execAsync = promisify(exec);

describe('CLI', () => {
  const cli = path.join(__dirname, '../src/cli.ts');
  const fixtureDir = path.join(process.cwd(), 'test-fixtures');
  const testFile = path.join(fixtureDir, 'input.ts');

  beforeAll(async () => {
    // Cleanup any existing files
    if (fs.existsSync(fixtureDir)) {
      fs.rmSync(fixtureDir, { recursive: true, force: true });
    }

    // Create test fixture directory and file
    fs.mkdirSync(fixtureDir, { recursive: true });
    fs.writeFileSync(testFile, 'export const hello = "world";');

    // Log test environment for debugging
    logger.info(`Test environment setup:
      - CLI path: ${cli}
      - Fixture directory: ${fixtureDir}
      - Test file: ${testFile}
      - File exists: ${fs.existsSync(testFile)}
      - Working directory: ${process.cwd()}
    `);

    // Wait for file operations to complete
    await new Promise(resolve => setTimeout(resolve, 1000));
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

  it('should show help message', async () => {
    const { stdout } = await execAsync(`npx ts-node "${cli}" --help`, {
      cwd: process.cwd()
    });
    expect(stdout).toContain('Usage:');
    expect(stdout).toContain('Options:');
  }, 15000);

  it('should bundle file with default options', async () => {
    expect(fs.existsSync(testFile)).toBe(true);

    const absoluteCli = path.resolve(cli);
    const absoluteInput = path.resolve(testFile);

    const { stdout, stderr } = await execAsync(`npx ts-node "${absoluteCli}" "${absoluteInput}"`, {
      cwd: process.cwd()
    });

    if (stderr) {
      console.error('Bundle stderr:', stderr);
    }

    expect(stdout).toContain('Bundle completed successfully');
  }, 15000);
});