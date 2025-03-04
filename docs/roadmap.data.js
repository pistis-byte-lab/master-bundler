
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

// Lê o conteúdo do arquivo ROADMAP.md na raiz do projeto
const roadmapPath = path.resolve(__dirname, '../ROADMAP.md');
const roadmapContent = fs.readFileSync(roadmapPath, 'utf8');

// Converte o markdown para HTML
const htmlContent = marked(roadmapContent);

// Exporta o conteúdo para ser usado no roadmap.md
exports.default = {
  content: htmlContent
};
