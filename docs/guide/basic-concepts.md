
# Conceitos Básicos

## O que é um Bundler?

Um bundler é uma ferramenta que combina vários arquivos de código em um único arquivo (ou um pequeno número de arquivos) otimizado para produção. Ele resolve dependências, aplica transformações e otimiza a saída para melhor performance.

## Por que usar TypeScript Bundler?

O TypeScript Bundler foi projetado para:

- Manter a tipagem segura durante todo o processo de empacotamento
- Suportar múltiplos formatos de saída (ESM, UMD, CJS)
- Otimizar o código através de tree shaking e minificação
- Proporcionar uma experiência de desenvolvimento fluida com watch mode e live reload
- Fornecer análise detalhada de pacotes para identificar problemas de tamanho

## Estrutura básica

Um projeto típico usando TypeScript Bundler terá a seguinte estrutura:

```
meu-projeto/
├── src/
│   ├── index.ts        # Ponto de entrada principal
│   └── ...             # Outros arquivos de código
├── dist/               # Saída do bundler
├── ts-bundler.config.js # Configuração do bundler
└── package.json
```

## Primeiros passos

Para iniciar um novo projeto:

1. Crie a estrutura de diretórios acima
2. Inicialize um projeto npm: `npm init -y`
3. Instale o TypeScript Bundler: `npm install --save-dev ts-bundler`
4. Crie um arquivo de configuração básico
5. Execute o bundler: `npx ts-bundler`
