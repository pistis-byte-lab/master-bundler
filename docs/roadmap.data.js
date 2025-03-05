
import fs from 'fs';
import path from 'path';
import { marked } from 'marked';
import { fileURLToPath } from 'url';

// Obter o diretório atual usando ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lê o conteúdo do arquivo ROADMAP.md na raiz do projeto
const roadmapPath = path.resolve(__dirname, '../ROADMAP.md');
const roadmapContent = fs.readFileSync(roadmapPath, 'utf8');

// Adiciona classes para melhorar a visualização
function enhanceHTML(html) {
  // Adiciona classes aos cabeçalhos de versão
  html = html.replace(/<h2 id="version[^>]*>(.*?)<\/h2>/g, 
    '<h2 id="version$1" class="version-heading">$1</h2>');
  
  // Adiciona classes aos cabeçalhos de funcionalidades
  html = html.replace(/<h3 id="([^"]*)">(.*?)<\/h3>/g,
    '<h3 id="$1" class="feature-heading">$2</h3>');
  
  // Adiciona classes aos itens completos e incompletos
  html = html.replace(/<li><p>\[x\](.*?)<\/p><\/li>/g, 
    '<li class="completed"><p><span class="checkmark">✓</span>$1</p></li>');
  html = html.replace(/<li><p>\[ \](.*?)<\/p><\/li>/g, 
    '<li class="pending"><p><span class="checkmark">○</span>$1</p></li>');
  
  // Adiciona marcador de status para versões
  html = html.replace(/<h2 id="version[^>]*>(.*?) \(Completed\)<\/h2>/g,
    '<h2 id="version$1" class="version-heading">$1 <span class="version-status completed-version">Completed</span></h2>');
  html = html.replace(/<h2 id="version[^>]*>(.*?) \(Em Desenvolvimento\)<\/h2>/g,
    '<h2 id="version$1" class="version-heading">$1 <span class="version-status in-progress-version">Em Desenvolvimento</span></h2>');
    
  // Certifica-se que subitens aninhados também são processados corretamente
  html = html.replace(/<li><p>- \[ \](.*?)<\/p><\/li>/g, 
    '<li class="pending"><p><span class="checkmark">○</span>$1</p></li>');
  
  return html;
}

// Converte o markdown para HTML
const htmlContent = enhanceHTML(marked(roadmapContent));

// Adiciona informações de progresso
function calculateProgress() {
  const totalTasks = (roadmapContent.match(/- \[[ x]\]/g) || []).length;
  const completedTasks = (roadmapContent.match(/- \[x\]/g) || []).length;
  const percentComplete = Math.round((completedTasks / totalTasks) * 100);
  
  // Calcular progresso por versão
  const versionRegex = /## Version ([\d\.]+) \((.*?)\)/g;
  const versions = [];
  let match;
  
  while ((match = versionRegex.exec(roadmapContent)) !== null) {
    const versionNumber = match[1];
    const status = match[2];
    const versionContent = roadmapContent.substring(match.index, roadmapContent.indexOf('## Version', match.index + 1) > -1 ? 
      roadmapContent.indexOf('## Version', match.index + 1) : roadmapContent.length);
    
    const versionTotalTasks = (versionContent.match(/- \[[ x]\]/g) || []).length;
    const versionCompletedTasks = (versionContent.match(/- \[x\]/g) || []).length;
    const versionPercentComplete = versionTotalTasks > 0 ? 
      Math.round((versionCompletedTasks / versionTotalTasks) * 100) : 100;
    
    versions.push({
      version: versionNumber,
      status,
      total: versionTotalTasks,
      completed: versionCompletedTasks,
      percent: versionPercentComplete
    });
  }
  
  return {
    total: totalTasks,
    completed: completedTasks,
    percent: percentComplete,
    versions
  };
}

const progress = calculateProgress();

// Exporta o conteúdo para ser usado no roadmap.md
export default {
  content: htmlContent,
  progress,
  lastUpdated: new Date().toLocaleDateString()
};
