"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeBuild = analyzeBuild;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const logger_1 = require("./utils/logger");
const chalk_1 = __importDefault(require("chalk"));
const child_process_1 = require("child_process");
async function analyzeBuild(result, options, analyzerOptions = {}) {
    logger_1.logger.info('Analyzing bundle...');
    const startTime = Date.now();
    // Collect output files
    const files = [];
    if (options.output) {
        files.push(options.output);
        if (options.sourcemap) {
            files.push(`${options.output}.map`);
        }
    }
    else if (options.outDir) {
        const outDir = path_1.default.resolve(process.cwd(), options.outDir);
        collectFiles(outDir, files);
    }
    // Calculate sizes
    const totalSize = files.reduce((total, file) => {
        try {
            return total + fs_1.default.statSync(file).size;
        }
        catch (error) {
            logger_1.logger.debug(`Could not get size for ${file}: ${error.message}`);
            return total;
        }
    }, 0);
    // Create modules map
    const modules = [];
    // Extract chunk info
    const chunks = [{
            id: 'main',
            name: 'main',
            size: totalSize,
            modules: modules,
        }];
    // Calculate gzip sizes if requested
    let totalGzipSize;
    try {
        // Check if gzip is available
        (0, child_process_1.execSync)('gzip --version', { stdio: 'ignore' });
        totalGzipSize = 0;
        for (const file of files) {
            if (fs_1.default.existsSync(file) && !file.endsWith('.map')) {
                try {
                    const gzipSize = parseInt((0, child_process_1.execSync)(`gzip -c "${file}" | wc -c`, { encoding: 'utf8' }).trim());
                    totalGzipSize += gzipSize;
                    // Update chunk info
                    for (const chunk of chunks) {
                        if (file.includes(chunk.name)) {
                            chunk.gzipSize = gzipSize;
                        }
                    }
                }
                catch (error) {
                    logger_1.logger.debug(`Could not calculate gzip size for ${file}: ${error.message}`);
                }
            }
        }
    }
    catch (error) {
        logger_1.logger.debug('gzip binary not available, skipping gzip size calculation');
    }
    const analysis = {
        totalSize,
        totalGzipSize,
        chunks,
        files,
        timestamp: Date.now(),
        buildTime: Date.now() - startTime
    };
    // Save analysis to file if requested
    if (analyzerOptions.outputFile) {
        const outputFile = path_1.default.resolve(process.cwd(), analyzerOptions.outputFile);
        fs_1.default.writeFileSync(outputFile, JSON.stringify(analysis, null, 2));
        logger_1.logger.info(`Bundle analysis saved to ${outputFile}`);
    }
    // Print summary
    printAnalysisSummary(analysis);
    // Visualize if requested
    if (analyzerOptions.visualize) {
        visualizeAnalysis(analysis, analyzerOptions.openBrowser);
    }
    return analysis;
}
function collectFiles(dir, files) {
    if (!fs_1.default.existsSync(dir)) {
        return;
    }
    const entries = fs_1.default.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path_1.default.join(dir, entry.name);
        if (entry.isDirectory()) {
            collectFiles(fullPath, files);
        }
        else if (entry.isFile() && !entry.name.endsWith('.map')) {
            files.push(fullPath);
        }
    }
}
function printAnalysisSummary(analysis) {
    console.log('\n' + chalk_1.default.bold('Bundle Analysis Summary:'));
    console.log(chalk_1.default.cyan('────────────────────────────────────────────'));
    console.log(`${chalk_1.default.bold('Total Size:')} ${formatBytes(analysis.totalSize)}`);
    if (analysis.totalGzipSize !== undefined) {
        console.log(`${chalk_1.default.bold('Gzipped Size:')} ${formatBytes(analysis.totalGzipSize)}`);
    }
    console.log(`${chalk_1.default.bold('Files:')} ${analysis.files.length}`);
    console.log(`${chalk_1.default.bold('Build Time:')} ${analysis.buildTime}ms`);
    console.log(chalk_1.default.cyan('────────────────────────────────────────────'));
    if (analysis.totalSize > 1024 * 1024) {
        console.log(chalk_1.default.yellow('⚠️ Warning: Bundle size exceeds 1MB. Consider code splitting or tree shaking.'));
    }
    console.log('');
}
function formatBytes(bytes) {
    if (bytes === 0)
        return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
function visualizeAnalysis(analysis, openBrowser = false) {
    // Save to temp HTML file
    const htmlContent = generateVisualizationHtml(analysis);
    const htmlFile = path_1.default.resolve(process.cwd(), 'bundle-analysis.html');
    fs_1.default.writeFileSync(htmlFile, htmlContent);
    logger_1.logger.info(`Bundle visualization saved to ${htmlFile}`);
    if (openBrowser) {
        try {
            const open = require('open');
            open(htmlFile);
        }
        catch (error) {
            logger_1.logger.error('Failed to open browser:', error);
        }
    }
}
function generateVisualizationHtml(analysis) {
    const fileData = analysis.files.map(file => {
        const size = fs_1.default.statSync(file).size;
        return {
            name: path_1.default.relative(process.cwd(), file),
            size,
            formattedSize: formatBytes(size)
        };
    }).sort((a, b) => b.size - a.size);
    const totalSize = formatBytes(analysis.totalSize);
    const gzipSize = analysis.totalGzipSize ? formatBytes(analysis.totalGzipSize) : 'N/A';
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bundle Analysis</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    h1, h2 {
      color: #2c3e50;
    }
    .summary {
      background-color: #f8f9fa;
      padding: 15px;
      border-radius: 5px;
      margin-bottom: 20px;
    }
    .summary-item {
      display: flex;
      justify-content: space-between;
      margin: 5px 0;
    }
    .file-list {
      border: 1px solid #dee2e6;
      border-radius: 5px;
      overflow: hidden;
    }
    .file-item {
      display: flex;
      padding: 10px 15px;
      border-bottom: 1px solid #dee2e6;
    }
    .file-item:last-child {
      border-bottom: none;
    }
    .file-name {
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .file-size {
      flex: 0 0 100px;
      text-align: right;
    }
    .file-bar {
      height: 10px;
      background: #4299e1;
      margin-top: 5px;
      border-radius: 2px;
    }
    .file-details {
      flex: 1;
    }
    .warning {
      color: #e53e3e;
      margin-top: 10px;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <h1>Bundle Analysis</h1>
  
  <div class="summary">
    <h2>Summary</h2>
    <div class="summary-item">
      <span>Total Size:</span>
      <strong>${totalSize}</strong>
    </div>
    <div class="summary-item">
      <span>Gzipped Size:</span>
      <strong>${gzipSize}</strong>
    </div>
    <div class="summary-item">
      <span>Files:</span>
      <strong>${analysis.files.length}</strong>
    </div>
    <div class="summary-item">
      <span>Build Time:</span>
      <strong>${analysis.buildTime}ms</strong>
    </div>
    ${analysis.totalSize > 1024 * 1024 ? '<div class="warning">⚠️ Warning: Bundle size exceeds 1MB. Consider code splitting or tree shaking.</div>' : ''}
  </div>
  
  <h2>Files</h2>
  <div class="file-list">
    ${fileData.map(file => {
        const percentage = (file.size / analysis.totalSize) * 100;
        return `
        <div class="file-item">
          <div class="file-details">
            <div class="file-name">${file.name}</div>
            <div class="file-bar" style="width: ${percentage}%"></div>
          </div>
          <div class="file-size">${file.formattedSize}</div>
        </div>
      `;
    }).join('')}
  </div>
  
  <script>
    // Add interactive features if needed
  </script>
</body>
</html>
  `;
}
//# sourceMappingURL=analyzer.js.map