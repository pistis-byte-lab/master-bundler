
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
# Sistema de Plugins

O TypeScript Bundler inclui um poderoso sistema de plugins que permite estender suas funcionalidades.

## O que são plugins?

Plugins são módulos que podem interagir com o processo de bundling em diferentes estágios, permitindo:

- Transformar código
- Processar arquivos especiais (como CSS, imagens, etc.)
- Adicionar otimizações personalizadas
- Modificar o comportamento do bundler

## Ciclo de vida dos plugins

Os plugins podem se conectar a diferentes pontos do ciclo de vida do bundling:

1. `setup`: Chamado quando o bundling inicia
2. `beforeTransform`: Chamado antes de qualquer transformação
3. `transform`: Chamado durante a fase principal de transformação
4. `afterTransform`: Chamado após todas as transformações
5. `cleanup`: Chamado quando o bundling é concluído

## Plugins inclusos

O TypeScript Bundler inclui alguns plugins por padrão:

- Minification Plugin: Para minificar o código
- CSS/SCSS Plugin: Para processar arquivos CSS e SCSS
- Asset Plugin: Para gerenciar arquivos estáticos como imagens e fontes

## Criando um plugin personalizado

Veja como criar um plugin básico:

```typescript
import { Plugin, PluginContext } from 'ts-bundler/plugins';

export class MyPlugin implements Plugin {
  name = 'my-plugin';

  // Configuração padrão
  defaultConfig = {
    option1: 'default-value',
    option2: true
  };

  setup(options, config) {
    // Inicializar o plugin
  }

  async transform(context) {
    // Transformar o código
    return modifiedContent;
  }

  cleanup() {
    // Limpar recursos
  }
}
```
