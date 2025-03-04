
# Sistema de Plugins

O TypeScript Bundler possui um sistema de plugins poderoso que permite estender sua funcionalidade para atender a requisitos específicos do seu projeto.

## O que são Plugins?

Plugins são módulos que podem intervir em diferentes estágios do processo de empacotamento, permitindo:

- Transformações personalizadas de código
- Processamento de arquivos especiais (CSS, imagens, etc.)
- Adição de comportamentos personalizados
- Otimizações específicas

## Ciclo de Vida dos Plugins

Os plugins podem se conectar a cinco pontos principais do ciclo de vida:

1. **setup**: Inicialização do plugin com opções
2. **beforeTransform**: Antes de qualquer transformação de código
3. **transform**: Durante a fase principal de transformação
4. **afterTransform**: Após todas as transformações
5. **cleanup**: Ao finalizar o empacotamento

## Plugins Integrados

O TypeScript Bundler vem com alguns plugins integrados:

- **Minification Plugin**: Minifica o código usando terser
- **CSS/SCSS Plugin**: Processa arquivos CSS e SCSS
- **Asset Plugin**: Gerencia ativos estáticos (imagens, fontes, etc.)

## Próximos Passos

- [Plugin API](/plugins/api): Detalhes da API de plugins
- [Criando Plugins](/plugins/creating-plugins): Aprenda a criar seus próprios plugins
- [Exemplos](/plugins/examples): Exemplos práticos de plugins
