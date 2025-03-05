
# Plugin Marketplace

O TypeScript Bundler inclui um sistema de marketplace de plugins que permite descobrir, instalar e gerenciar plugins facilmente. Este sistema facilita a extensão das funcionalidades do bundler sem precisar criar plugins manualmente.

## Usando o Marketplace via CLI

O marketplace pode ser acessado através da CLI usando o comando `marketplace`:

```bash
ts-bundler marketplace <comando> [opções]
```

### Comandos Disponíveis

#### Listar Plugins Disponíveis

Para visualizar todos os plugins disponíveis no marketplace:

```bash
ts-bundler marketplace list
```

Opções:
- `-r, --refresh`: Atualiza o cache de plugins

#### Instalar um Plugin

Para instalar um plugin específico:

```bash
ts-bundler marketplace install <pluginId>
```

#### Desinstalar um Plugin

Para remover um plugin instalado:

```bash
ts-bundler marketplace uninstall <pluginId>
```

#### Atualizar um Plugin

Para atualizar um plugin para a versão mais recente:

```bash
ts-bundler marketplace update <pluginId>
```

#### Listar Plugins Instalados

Para ver todos os plugins instalados:

```bash
ts-bundler marketplace installed
```

## API do Marketplace

Também é possível utilizar o marketplace programaticamente:

```typescript
import { pluginMarketplace } from 'ts-bundler/plugins/marketplace';

// Listar plugins disponíveis
const plugins = await pluginMarketplace.getPlugins();

// Instalar um plugin
await pluginMarketplace.installPlugin('css-plugin');

// Desinstalar um plugin
await pluginMarketplace.uninstallPlugin('css-plugin');

// Atualizar um plugin
await pluginMarketplace.updatePlugin('css-plugin');

// Listar plugins instalados
const installedPlugins = pluginMarketplace.listInstalledPlugins();
```

## Criando Plugins para o Marketplace

Se você deseja criar um plugin compatível com o marketplace, siga as diretrizes em [Criando Plugins](/plugins/creating-plugins) e certifique-se de incluir metadados adequados:

```typescript
export const metadata = {
  name: 'Meu Plugin Incrível',
  version: '1.0.0',
  description: 'Este plugin faz coisas incríveis',
  author: 'Seu Nome',
  repository: 'https://github.com/seu-usuario/meu-plugin'
};

export default class MeuPlugin {
  // Implementação do plugin
}
```

## Publicando Plugins no Marketplace

Para publicar seu plugin no marketplace oficial:

1. Certifique-se de que seu plugin segue todas as diretrizes
2. Publique-o como um pacote npm com o prefixo `ts-bundler-plugin-`
3. Envie uma solicitação de adição no repositório do marketplace

Sua solicitação será revisada e, se aprovada, seu plugin será adicionado ao marketplace oficial.
