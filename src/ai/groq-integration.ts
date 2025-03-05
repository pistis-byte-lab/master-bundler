
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../utils/logger';

/**
 * Classe para integração com a API Groq
 * Fornece funcionalidades de análise de código e otimização usando LLMs
 */
export class GroqAIService {
  private apiKey: string | null = null;
  private baseUrl = 'https://api.groq.com/openai/v1';
  private model = 'llama3-70b-8192'; // Modelo rápido e gratuito do Groq

  constructor() {
    // Tenta obter a API key do ambiente
    this.apiKey = process.env.GROQ_API_KEY || null;
  }

  /**
   * Verifica se a integração está configurada
   */
  public isConfigured(): boolean {
    return this.apiKey !== null;
  }

  /**
   * Configura a API key
   */
  public setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  /**
   * Analisa um trecho de código e sugere otimizações
   */
  public async analyzeCode(code: string): Promise<string> {
    if (!this.isConfigured()) {
      logger.warn('API Groq não configurada. Configure GROQ_API_KEY no ambiente.');
      return 'API não configurada';
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: this.model,
          messages: [
            { 
              role: 'system', 
              content: 'Você é um analisador de código especializado em identificar oportunidades de otimização em JavaScript/TypeScript para melhorar o desempenho de bundles.'
            },
            { 
              role: 'user', 
              content: `Analise este código e sugira três otimizações específicas para melhorar o desempenho:\n\n${code}`
            }
          ],
          temperature: 0.2,
          max_tokens: 1000
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      logger.error(`Erro ao analisar código com Groq: ${error.message}`);
      return `Erro ao analisar código: ${error.message}`;
    }
  }

  /**
   * Otimiza automaticamente um bundle analisando padrões de uso
   * e identificando possíveis melhorias
   */
  public async suggestBundleOptimizations(
    bundleStats: any,
    sampleCode: string[] = []
  ): Promise<string> {
    if (!this.isConfigured()) {
      logger.warn('API Groq não configurada. Configure GROQ_API_KEY no ambiente.');
      return 'API não configurada';
    }

    try {
      // Prepara os dados de análise do bundle para o modelo
      const bundleData = JSON.stringify(bundleStats, null, 2);
      const codeExamples = sampleCode.join('\n\n');
      
      const prompt = `
Analise estas estatísticas de bundle e sugestões de otimização:

ESTATÍSTICAS DO BUNDLE:
${bundleData}

EXEMPLOS DE CÓDIGO DO PROJETO:
${codeExamples}

Com base nestes dados, sugira:
1. Módulos que poderiam ser divididos em chunks separados
2. Código que poderia ser carregado sob demanda
3. Dependências que poderiam ser externalizadas
4. Otimizações específicas para reduzir o tamanho do bundle`;

      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: this.model,
          messages: [
            { 
              role: 'system', 
              content: 'Você é um especialista em otimização de bundles JavaScript/TypeScript, com foco em redução de tamanho, code splitting e carregamento eficiente.'
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3,
          max_tokens: 2000
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      logger.error(`Erro ao obter otimizações de bundle com Groq: ${error.message}`);
      return `Erro ao analisar bundle: ${error.message}`;
    }
  }

  /**
   * Gera uma configuração de bundling otimizada com base na análise do projeto
   */
  public async generateOptimizedConfig(
    currentConfig: any,
    projectStructure: any
  ): Promise<string> {
    if (!this.isConfigured()) {
      logger.warn('API Groq não configurada. Configure GROQ_API_KEY no ambiente.');
      return 'API não configurada';
    }

    try {
      const configStr = JSON.stringify(currentConfig, null, 2);
      const structureStr = JSON.stringify(projectStructure, null, 2);

      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: this.model,
          messages: [
            { 
              role: 'system', 
              content: 'Você é um especialista em configuração de bundlers JavaScript/TypeScript, com foco em otimização para produção.'
            },
            { 
              role: 'user', 
              content: `Analise esta configuração atual e estrutura do projeto, e gere uma configuração otimizada para o Master Bundler:

CONFIGURAÇÃO ATUAL:
${configStr}

ESTRUTURA DO PROJETO:
${structureStr}

Gere uma configuração otimizada em TypeScript que melhore:
1. O tamanho final do bundle
2. Tempo de carregamento
3. Divisão de código
4. Compatibilidade com browsers`
            }
          ],
          temperature: 0.2,
          max_tokens: 1500
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      logger.error(`Erro ao gerar configuração otimizada: ${error.message}`);
      return `Erro ao gerar configuração: ${error.message}`;
    }
  }
}

// Exporta uma instância única do serviço
export const groqService = new GroqAIService();
