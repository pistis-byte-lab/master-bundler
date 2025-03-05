
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
  
  // Adiciona classes aos itens completos e incompletos
  html = html.replace(/<li><p>\[x\](.*?)<\/p><\/li>/g, 
    '<li class="completed"><p><span class="checkmark">✓</span>$1</p></li>');
  html = html.replace(/<li><p>\[ \](.*?)<\/p><\/li>/g, 
    '<li class="pending"><p><span class="checkmark">○</span>$1</p></li>');
    
  return html;
}

// Converte o markdown para HTML
const htmlContent = enhanceHTML(marked(roadmapContent));

// Exporta o conteúdo para ser usado no roadmap.md
export default {
  content: htmlContent,
  lastUpdated: new Date().toLocaleDateString()
};
