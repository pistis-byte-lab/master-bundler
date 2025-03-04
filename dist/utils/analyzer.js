"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BundleAnalyzer = void 0;
exports.createBundleAnalyzer = createBundleAnalyzer;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const logger_1 = require("./logger");
class BundleAnalyzer {
    constructor() {
        this.analysis = {
            totalSize: 0,
            modules: [],
            chunks: [],
            entryPoints: []
        };
    }
    async analyzeBundleFromStats(statsFilePath) {
        try {
            const statsData = await fs_1.default.promises.readFile(statsFilePath, 'utf-8');
            const stats = JSON.parse(statsData);
            return this.analyzeBundleFromObject(stats);
        }
        catch (error) {
            logger_1.logger.error(`Erro ao analisar arquivo de estatísticas: ${error}`);
            throw error;
        }
    }
    analyzeBundleFromObject(stats) {
        // Extrair módulos
        if (stats.modules) {
            this.analysis.modules = stats.modules.map((mod) => ({
                id: mod.id,
                name: mod.name,
                size: mod.size || 0,
                dependencies: mod.dependencies || [],
                dependents: [],
                isExternal: mod.isExternal || false
            }));
            // Calcular dependentes
            for (const mod of this.analysis.modules) {
                for (const depId of mod.dependencies) {
                    const depModule = this.analysis.modules.find(m => m.id === depId);
                    if (depModule) {
                        depModule.dependents.push(mod.id);
                    }
                }
            }
        }
        // Extrair chunks
        if (stats.chunks) {
            this.analysis.chunks = stats.chunks.map((chunk) => ({
                id: chunk.id,
                name: chunk.name || chunk.id,
                size: chunk.size || 0,
                modules: chunk.modules || []
            }));
        }
        // Extrair entry points
        if (stats.entrypoints) {
            this.analysis.entryPoints = Object.keys(stats.entrypoints);
        }
        // Calcular tamanho total
        this.analysis.totalSize = this.analysis.modules.reduce((sum, mod) => sum + mod.size, 0);
        return this.analysis;
    }
    async generateReport(outputPath) {
        try {
            // Gerar relatório JSON
            await fs_1.default.promises.writeFile(outputPath, JSON.stringify(this.analysis, null, 2), 'utf-8');
            // Gerar relatório HTML
            const htmlPath = outputPath.replace(/\.json$/, '.html');
            await fs_1.default.promises.writeFile(htmlPath, this.generateHTMLReport(), 'utf-8');
            logger_1.logger.success(`Relatório de análise gerado em:\n${outputPath}\n${htmlPath}`);
        }
        catch (error) {
            logger_1.logger.error(`Erro ao gerar relatório: ${error}`);
            throw error;
        }
    }
    generateHTMLReport() {
        const modulesTotalSize = this.analysis.totalSize;
        const largestModules = [...this.analysis.modules]
            .sort((a, b) => b.size - a.size)
            .slice(0, 10);
        const largestChunks = [...this.analysis.chunks]
            .sort((a, b) => b.size - a.size);
        // Dados para gráficos
        const moduleSizes = JSON.stringify(largestModules.map(mod => ({
            name: path_1.default.basename(mod.name),
            size: mod.size,
            percentage: (mod.size / modulesTotalSize) * 100
        })));
        const chunkSizes = JSON.stringify(largestChunks.map(chunk => ({
            name: chunk.name,
            size: chunk.size,
            percentage: (chunk.size / modulesTotalSize) * 100
        })));
        return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bundle Analysis Report</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      color: #333;
    }
    h1, h2, h3 {
      color: #0066cc;
    }
    .summary {
      display: flex;
      justify-content: space-between;
      background-color: #f8f9fa;
      padding: 20px;
      border-radius: 5px;
      margin-bottom: 20px;
    }
    .summary-item {
      text-align: center;
    }
    .summary-value {
      font-size: 24px;
      font-weight: bold;
    }
    .charts {
      display: flex;
      gap: 20px;
      margin-bottom: 20px;
    }
    .chart-container {
      flex: 1;
      background-color: #f8f9fa;
      padding: 15px;
      border-radius: 5px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th {
      background-color: #f2f2f2;
    }
    tr:hover {
      background-color: #f5f5f5;
    }
    .size-bar {
      background-color: #0066cc;
      height: 10px;
      border-radius: 5px;
    }
    .size-bar-container {
      width: 200px;
      background-color: #e9ecef;
      border-radius: 5px;
    }
    .footer {
      margin-top: 40px;
      text-align: center;
      color: #6c757d;
    }
  </style>
</head>
<body>
  <h1>Bundle Analysis Report</h1>
  
  <div class="summary">
    <div class="summary-item">
      <div class="summary-value">${this.formatSize(this.analysis.totalSize)}</div>
      <div>Total Size</div>
    </div>
    <div class="summary-item">
      <div class="summary-value">${this.analysis.modules.length}</div>
      <div>Modules</div>
    </div>
    <div class="summary-item">
      <div class="summary-value">${this.analysis.chunks.length}</div>
      <div>Chunks</div>
    </div>
    <div class="summary-item">
      <div class="summary-value">${this.analysis.entryPoints.length}</div>
      <div>Entry Points</div>
    </div>
  </div>
  
  <div class="charts">
    <div class="chart-container">
      <h2>Largest Modules</h2>
      <canvas id="modulesChart"></canvas>
    </div>
    <div class="chart-container">
      <h2>Chunks</h2>
      <canvas id="chunksChart"></canvas>
    </div>
  </div>
  
  <h2>Top 10 Largest Modules</h2>
  <table>
    <thead>
      <tr>
        <th>Module</th>
        <th>Size</th>
        <th>% of Total</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      ${largestModules.map(mod => `
        <tr>
          <td title="${mod.name}">${this.truncatePath(mod.name)}</td>
          <td>${this.formatSize(mod.size)}</td>
          <td>${((mod.size / modulesTotalSize) * 100).toFixed(2)}%</td>
          <td>
            <div class="size-bar-container">
              <div class="size-bar" style="width: ${(mod.size / largestModules[0].size) * 100}%"></div>
            </div>
          </td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  <h2>Chunks</h2>
  <table>
    <thead>
      <tr>
        <th>Chunk</th>
        <th>Size</th>
        <th>Modules</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      ${largestChunks.map(chunk => `
        <tr>
          <td>${chunk.name}</td>
          <td>${this.formatSize(chunk.size)}</td>
          <td>${chunk.modules.length}</td>
          <td>
            <div class="size-bar-container">
              <div class="size-bar" style="width: ${(chunk.size / largestChunks[0].size) * 100}%"></div>
            </div>
          </td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  <div class="footer">
    Generated on ${new Date().toLocaleString()}
  </div>
  
  <script>
    // Module sizes chart
    const modulesData = ${moduleSizes};
    new Chart(document.getElementById('modulesChart'), {
      type: 'pie',
      data: {
        labels: modulesData.map(item => item.name),
        datasets: [{
          data: modulesData.map(item => item.size),
          backgroundColor: [
            '#0066cc', '#00cc99', '#cc9900', '#cc0066', '#9900cc',
            '#0099cc', '#00cc66', '#cc6600', '#cc0033', '#6600cc'
          ]
        }]
      },
      options: {
        responsive: true,
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                const item = modulesData[context.dataIndex];
                return \`\${item.name}: \${formatSize(item.size)} (\${item.percentage.toFixed(2)}%)\`;
              }
            }
          }
        }
      }
    });
    
    // Chunks chart
    const chunkData = ${chunkSizes};
    new Chart(document.getElementById('chunksChart'), {
      type: 'pie',
      data: {
        labels: chunkData.map(item => item.name),
        datasets: [{
          data: chunkData.map(item => item.size),
          backgroundColor: [
            '#0066cc', '#00cc99', '#cc9900', '#cc0066', '#9900cc',
            '#0099cc', '#00cc66', '#cc6600', '#cc0033', '#6600cc'
          ]
        }]
      },
      options: {
        responsive: true,
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                const item = chunkData[context.dataIndex];
                return \`\${item.name}: \${formatSize(item.size)} (\${item.percentage.toFixed(2)}%)\`;
              }
            }
          }
        }
      }
    });
    
    function formatSize(bytes) {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
  </script>
</body>
</html>
    `;
    }
    formatSize(bytes) {
        if (bytes === 0)
            return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    truncatePath(path, maxLength = 50) {
        if (path.length <= maxLength)
            return path;
        const fileName = path.split('/').pop() || '';
        const dirPath = path.substring(0, path.length - fileName.length);
        if (fileName.length > maxLength - 3) {
            return '...' + fileName.substring(fileName.length - (maxLength - 3));
        }
        const remainingLength = maxLength - fileName.length - 3;
        return '...' + dirPath.substring(dirPath.length - remainingLength) + fileName;
    }
}
exports.BundleAnalyzer = BundleAnalyzer;
// Função auxiliar para criar um analisador
function createBundleAnalyzer() {
    return new BundleAnalyzer();
}
//# sourceMappingURL=analyzer.js.map