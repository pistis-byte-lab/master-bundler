
import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import { logger } from './logger';

/**
 * Classe para geração automática de documentação a partir do código fonte
 */
export class DocGenerator {
  private sourceDirs: string[];
  private outputDir: string;
  private fileTypes: string[];
  
  /**
   * Inicializa o gerador de documentação
   * @param sourceDirs Diretórios contendo arquivos de código fonte
   * @param outputDir Diretório onde a documentação será gerada
   * @param fileTypes Tipos de arquivo a serem processados
   */
  constructor(
    sourceDirs: string[] = ['src'], 
    outputDir: string = 'docs/api', 
    fileTypes: string[] = ['.ts', '.tsx']
  ) {
    this.sourceDirs = sourceDirs;
    this.outputDir = outputDir;
    this.fileTypes = fileTypes;
  }
  
  /**
   * Gera documentação para todos os arquivos nos diretórios de origem
   */
  public async generateDocs(): Promise<void> {
    logger.info('Iniciando geração de documentação automática...');
    
    // Garantir que o diretório de saída existe
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
    
    // Processar todos os diretórios de origem
    for (const sourceDir of this.sourceDirs) {
      await this.processDirectory(sourceDir);
    }
    
    // Gerar índice principal
    await this.generateIndex();
    
    logger.success('Documentação gerada com sucesso!');
  }
  
  /**
   * Processa um diretório recursivamente
   * @param dirPath Caminho do diretório a ser processado
   */
  private async processDirectory(dirPath: string): Promise<void> {
    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        // Criar subdiretório na documentação
        const subDir = path.join(this.outputDir, path.relative(this.sourceDirs[0], filePath));
        if (!fs.existsSync(subDir)) {
          fs.mkdirSync(subDir, { recursive: true });
        }
        
        await this.processDirectory(filePath);
      } else if (this.fileTypes.includes(path.extname(file))) {
        await this.processFile(filePath);
      }
    }
  }
  
  /**
   * Processa um arquivo TypeScript e extrai documentação
   * @param filePath Caminho do arquivo a ser processado
   */
  private async processFile(filePath: string): Promise<void> {
    logger.info(`Processando arquivo: ${filePath}`);
    
    // Ler o conteúdo do arquivo
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    
    // Analisar o arquivo com TypeScript Compiler API
    const sourceFile = ts.createSourceFile(
      filePath,
      fileContent,
      ts.ScriptTarget.Latest,
      true
    );
    
    // Extrair documentação e metadados
    const docContent = this.extractDocumentation(sourceFile, filePath);
    
    // Determinar o caminho de saída
    const relativePath = path.relative(this.sourceDirs[0], filePath);
    const outputFilePath = path.join(
      this.outputDir, 
      relativePath.replace(path.extname(filePath), '.md')
    );
    
    // Garantir que o diretório pai existe
    const outputFileDir = path.dirname(outputFilePath);
    if (!fs.existsSync(outputFileDir)) {
      fs.mkdirSync(outputFileDir, { recursive: true });
    }
    
    // Escrever o conteúdo da documentação
    fs.writeFileSync(outputFilePath, docContent);
    
    logger.info(`Documentação gerada: ${outputFilePath}`);
  }
  
  /**
   * Extrai documentação de um arquivo TypeScript
   * @param sourceFile Arquivo fonte TypeScript
   * @param filePath Caminho do arquivo original
   * @returns Conteúdo markdown para a documentação
   */
  private extractDocumentation(sourceFile: ts.SourceFile, filePath: string): string {
    const fileName = path.basename(filePath);
    const moduleName = path.basename(filePath, path.extname(filePath));
    
    let output = `# Módulo: ${moduleName}\n\n`;
    output += `Arquivo: \`${fileName}\`\n\n`;
    
    // Extrair descrição do módulo (se houver um comentário JSDoc no início do arquivo)
    const moduleDescription = this.extractModuleDescription(sourceFile);
    if (moduleDescription) {
      output += `## Descrição\n\n${moduleDescription}\n\n`;
    }
    
    // Extrair funções
    const functions = this.extractFunctions(sourceFile);
    if (functions.length > 0) {
      output += `## Funções\n\n`;
      functions.forEach(func => {
        output += `### ${func.name}\n\n`;
        if (func.description) {
          output += `${func.description}\n\n`;
        }
        
        if (func.params.length > 0) {
          output += `#### Parâmetros\n\n`;
          output += `| Nome | Tipo | Descrição |\n`;
          output += `|------|------|----------|\n`;
          func.params.forEach(param => {
            output += `| \`${param.name}\` | \`${param.type || 'any'}\` | ${param.description || '-'} |\n`;
          });
          output += `\n`;
        }
        
        if (func.returns) {
          output += `#### Retorno\n\n`;
          output += `\`${func.returns.type || 'void'}\`: ${func.returns.description || '-'}\n\n`;
        }
        
        if (func.example) {
          output += `#### Exemplo\n\n`;
          output += "```typescript\n";
          output += `${func.example}\n`;
          output += "```\n\n";
        }
      });
    }
    
    // Extrair classes
    const classes = this.extractClasses(sourceFile);
    if (classes.length > 0) {
      output += `## Classes\n\n`;
      classes.forEach(cls => {
        output += `### ${cls.name}\n\n`;
        if (cls.description) {
          output += `${cls.description}\n\n`;
        }
        
        if (cls.methods.length > 0) {
          output += `#### Métodos\n\n`;
          cls.methods.forEach(method => {
            output += `##### ${method.name}\n\n`;
            if (method.description) {
              output += `${method.description}\n\n`;
            }
            
            if (method.params.length > 0) {
              output += `**Parâmetros**\n\n`;
              output += `| Nome | Tipo | Descrição |\n`;
              output += `|------|------|----------|\n`;
              method.params.forEach(param => {
                output += `| \`${param.name}\` | \`${param.type || 'any'}\` | ${param.description || '-'} |\n`;
              });
              output += `\n`;
            }
            
            if (method.returns) {
              output += `**Retorno**\n\n`;
              output += `\`${method.returns.type || 'void'}\`: ${method.returns.description || '-'}\n\n`;
            }
          });
        }
        
        if (cls.properties.length > 0) {
          output += `#### Propriedades\n\n`;
          output += `| Nome | Tipo | Descrição |\n`;
          output += `|------|------|----------|\n`;
          cls.properties.forEach(prop => {
            output += `| \`${prop.name}\` | \`${prop.type || 'any'}\` | ${prop.description || '-'} |\n`;
          });
          output += `\n`;
        }
      });
    }
    
    // Extrair interfaces e tipos
    const interfaces = this.extractInterfaces(sourceFile);
    if (interfaces.length > 0) {
      output += `## Interfaces e Tipos\n\n`;
      interfaces.forEach(iface => {
        output += `### ${iface.name}\n\n`;
        if (iface.description) {
          output += `${iface.description}\n\n`;
        }
        
        if (iface.properties.length > 0) {
          output += `#### Propriedades\n\n`;
          output += `| Nome | Tipo | Descrição |\n`;
          output += `|------|------|----------|\n`;
          iface.properties.forEach(prop => {
            output += `| \`${prop.name}\` | \`${prop.type || 'any'}\` | ${prop.description || '-'} |\n`;
          });
          output += `\n`;
        }
      });
    }
    
    // Adicionar rodapé
    output += `---\n\n`;
    output += `*Esta documentação foi gerada automaticamente em ${new Date().toLocaleString()}.*\n`;
    
    return output;
  }
  
  /**
   * Extrai a descrição do módulo do arquivo fonte
   */
  private extractModuleDescription(sourceFile: ts.SourceFile): string | null {
    const leadingComments = ts.getLeadingCommentRanges(sourceFile.getFullText(), 0);
    if (!leadingComments || leadingComments.length === 0) {
      return null;
    }
    
    const commentText = sourceFile.getFullText().slice(
      leadingComments[0].pos,
      leadingComments[0].end
    );
    
    return this.formatJSDocComment(commentText);
  }
  
  /**
   * Extrai funções do arquivo fonte
   */
  private extractFunctions(sourceFile: ts.SourceFile): any[] {
    const functions: any[] = [];
    
    // Função recursiva para visitar todos os nós
    const visit = (node: ts.Node) => {
      if (ts.isFunctionDeclaration(node) && node.name) {
        const func: any = {
          name: node.name.getText(),
          params: [],
          returns: null
        };
        
        // Extrair JSDoc
        const jsDoc = this.getJSDocForNode(node, sourceFile);
        if (jsDoc) {
          func.description = jsDoc.description;
          func.example = jsDoc.example;
          
          // Parâmetros e retorno do JSDoc
          if (jsDoc.params) {
            func.params = jsDoc.params;
          }
          
          if (jsDoc.returns) {
            func.returns = jsDoc.returns;
          }
        }
        
        // Extrair parâmetros da assinatura da função
        if (node.parameters && node.parameters.length > 0) {
          node.parameters.forEach(param => {
            const paramName = param.name.getText();
            const existingParam = func.params.find((p: any) => p.name === paramName);
            
            if (!existingParam) {
              func.params.push({
                name: paramName,
                type: param.type ? param.type.getText() : 'any',
                description: ''
              });
            } else if (!existingParam.type && param.type) {
              existingParam.type = param.type.getText();
            }
          });
        }
        
        // Extrair tipo de retorno da assinatura da função
        if (node.type) {
          if (!func.returns) {
            func.returns = {
              type: node.type.getText(),
              description: ''
            };
          } else if (!func.returns.type) {
            func.returns.type = node.type.getText();
          }
        }
        
        functions.push(func);
      }
      
      ts.forEachChild(node, visit);
    };
    
    visit(sourceFile);
    
    return functions;
  }
  
  /**
   * Extrai classes do arquivo fonte
   */
  private extractClasses(sourceFile: ts.SourceFile): any[] {
    const classes: any[] = [];
    
    // Função recursiva para visitar todos os nós
    const visit = (node: ts.Node) => {
      if (ts.isClassDeclaration(node) && node.name) {
        const cls: any = {
          name: node.name.getText(),
          methods: [],
          properties: [],
          description: ''
        };
        
        // Extrair JSDoc
        const jsDoc = this.getJSDocForNode(node, sourceFile);
        if (jsDoc) {
          cls.description = jsDoc.description;
        }
        
        // Extrair métodos e propriedades
        if (node.members) {
          node.members.forEach(member => {
            if (ts.isMethodDeclaration(member) && member.name) {
              const method: any = {
                name: member.name.getText(),
                params: [],
                returns: null
              };
              
              // Extrair JSDoc
              const methodJSDoc = this.getJSDocForNode(member, sourceFile);
              if (methodJSDoc) {
                method.description = methodJSDoc.description;
                
                // Parâmetros e retorno do JSDoc
                if (methodJSDoc.params) {
                  method.params = methodJSDoc.params;
                }
                
                if (methodJSDoc.returns) {
                  method.returns = methodJSDoc.returns;
                }
              }
              
              cls.methods.push(method);
            } else if (ts.isPropertyDeclaration(member) && member.name) {
              const property: any = {
                name: member.name.getText(),
                type: member.type ? member.type.getText() : 'any',
                description: ''
              };
              
              // Extrair JSDoc
              const propJSDoc = this.getJSDocForNode(member, sourceFile);
              if (propJSDoc) {
                property.description = propJSDoc.description;
              }
              
              cls.properties.push(property);
            }
          });
        }
        
        classes.push(cls);
      }
      
      ts.forEachChild(node, visit);
    };
    
    visit(sourceFile);
    
    return classes;
  }
  
  /**
   * Extrai interfaces do arquivo fonte
   */
  private extractInterfaces(sourceFile: ts.SourceFile): any[] {
    const interfaces: any[] = [];
    
    // Função recursiva para visitar todos os nós
    const visit = (node: ts.Node) => {
      if ((ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) && node.name) {
        const iface: any = {
          name: node.name.getText(),
          properties: [],
          description: ''
        };
        
        // Extrair JSDoc
        const jsDoc = this.getJSDocForNode(node, sourceFile);
        if (jsDoc) {
          iface.description = jsDoc.description;
        }
        
        // Extrair propriedades para interfaces
        if (ts.isInterfaceDeclaration(node) && node.members) {
          node.members.forEach(member => {
            if (ts.isPropertySignature(member) && member.name) {
              const property: any = {
                name: member.name.getText(),
                type: member.type ? member.type.getText() : 'any',
                description: ''
              };
              
              // Extrair JSDoc
              const propJSDoc = this.getJSDocForNode(member, sourceFile);
              if (propJSDoc) {
                property.description = propJSDoc.description;
              }
              
              iface.properties.push(property);
            }
          });
        }
        
        interfaces.push(iface);
      }
      
      ts.forEachChild(node, visit);
    };
    
    visit(sourceFile);
    
    return interfaces;
  }
  
  /**
   * Obtém o JSDoc para um nó específico
   */
  private getJSDocForNode(node: ts.Node, sourceFile: ts.SourceFile): any {
    // Verificar se o nó tem comentários JSDoc
    const nodePos = node.getFullStart();
    const comments = ts.getLeadingCommentRanges(sourceFile.getFullText(), nodePos);
    
    if (!comments || comments.length === 0) {
      return null;
    }
    
    // Analisar o último comentário (mais próximo do nó)
    const comment = comments[comments.length - 1];
    const commentText = sourceFile.getFullText().slice(comment.pos, comment.end);
    
    // Verificar se é um comentário JSDoc
    if (!commentText.startsWith('/**')) {
      return null;
    }
    
    return this.parseJSDocComment(commentText);
  }
  
  /**
   * Analisa um comentário JSDoc
   */
  private parseJSDocComment(comment: string): any {
    const result: any = {
      description: '',
      params: [],
      returns: null,
      example: null
    };
    
    // Remover caracteres especiais do JSDoc
    const lines = comment
      .replace(/\/\*\*|\*\/|\*/g, '')
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    let currentSection = 'description';
    let descriptionLines: string[] = [];
    let exampleLines: string[] = [];
    
    for (const line of lines) {
      if (line.startsWith('@param')) {
        currentSection = 'param';
        const paramMatch = line.match(/@param\s+(?:{([^}]+)})?\s*(\w+)(?:\s*-\s*(.*))?/);
        
        if (paramMatch) {
          const [, type, name, description] = paramMatch;
          result.params.push({
            name,
            type: type || 'any',
            description: description || ''
          });
        }
      } else if (line.startsWith('@returns') || line.startsWith('@return')) {
        currentSection = 'returns';
        const returnMatch = line.match(/@returns?\s+(?:{([^}]+)})?\s*(.+)?/);
        
        if (returnMatch) {
          const [, type, description] = returnMatch;
          result.returns = {
            type: type || 'void',
            description: description || ''
          };
        }
      } else if (line.startsWith('@example')) {
        currentSection = 'example';
      } else {
        // Continuar na seção atual
        if (currentSection === 'description') {
          descriptionLines.push(line);
        } else if (currentSection === 'example') {
          exampleLines.push(line);
        } else if (currentSection === 'param' && result.params.length > 0) {
          // Adicionar ao último parâmetro
          const lastParam = result.params[result.params.length - 1];
          if (lastParam.description) {
            lastParam.description += ' ' + line;
          } else {
            lastParam.description = line;
          }
        } else if (currentSection === 'returns' && result.returns) {
          // Adicionar à descrição do retorno
          if (result.returns.description) {
            result.returns.description += ' ' + line;
          } else {
            result.returns.description = line;
          }
        }
      }
    }
    
    result.description = descriptionLines.join(' ').trim();
    result.example = exampleLines.length > 0 ? exampleLines.join('\n').trim() : null;
    
    return result;
  }
  
  /**
   * Formata um comentário JSDoc para texto Markdown
   */
  private formatJSDocComment(comment: string): string {
    // Remover caracteres especiais do JSDoc
    return comment
      .replace(/\/\*\*|\*\/|\*/g, '')
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join(' ')
      .trim();
  }
  
  /**
   * Gera o arquivo de índice para a documentação
   */
  private async generateIndex(): Promise<void> {
    let content = '# Documentação da API\n\n';
    content += 'Esta documentação foi gerada automaticamente a partir dos comentários do código fonte.\n\n';
    
    // Obter todos os arquivos markdown gerados
    const files = this.getAllMarkdownFiles(this.outputDir);
    
    // Agrupar por diretórios
    const filesByDir: Record<string, string[]> = {};
    files.forEach(file => {
      const dir = path.dirname(path.relative(this.outputDir, file));
      if (!filesByDir[dir]) {
        filesByDir[dir] = [];
      }
      filesByDir[dir].push(file);
    });
    
    // Gerar links para cada diretório
    Object.keys(filesByDir).sort().forEach(dir => {
      const displayDir = dir === '.' ? 'Principal' : dir;
      content += `## ${displayDir}\n\n`;
      
      filesByDir[dir].sort().forEach(file => {
        const relativePath = path.relative(this.outputDir, file);
        const fileName = path.basename(file, '.md');
        
        content += `- [${fileName}](./${relativePath})\n`;
      });
      
      content += '\n';
    });
    
    // Adicionar rodapé
    content += '---\n\n';
    content += `*Índice gerado em ${new Date().toLocaleString()}*\n`;
    
    // Escrever o arquivo de índice
    fs.writeFileSync(path.join(this.outputDir, 'index.md'), content);
  }
  
  /**
   * Retorna todos os arquivos markdown em um diretório e seus subdiretórios
   */
  private getAllMarkdownFiles(dir: string): string[] {
    let results: string[] = [];
    
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        results = results.concat(this.getAllMarkdownFiles(filePath));
      } else if (file.endsWith('.md') && file !== 'index.md') {
        results.push(filePath);
      }
    }
    
    return results;
  }
}
