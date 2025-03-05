
# Instalação

## Pré-requisitos

- Node.js (versão 14 ou superior)
- npm ou yarn

## Instalação Global

Para instalar o TypeScript Bundler globalmente:

```bash
npm install -g ts-bundler
```

Isso permitirá que você utilize o CLI em qualquer diretório:

```bash
ts-bundler input.ts --format esm
```

## Instalação Local

Para projetos específicos, recomendamos instalar localmente:

```bash
npm install --save-dev ts-bundler
```

Depois de instalado localmente, você pode adicionar scripts ao seu `package.json`:

```json
{
  "scripts": {
    "build": "ts-bundler src/index.ts --format esm",
    "dev": "ts-bundler src/index.ts --watch --format esm"
  }
}
```

## Verificando a Instalação

Para verificar se a instalação foi bem-sucedida:

```bash
ts-bundler --help
```

Se tudo estiver correto, você verá a tela de ajuda com todas as opções disponíveis.
# Instalação

## Requisitos

- Node.js v14 ou superior
- npm v6 ou superior

## Instalação global

Você pode instalar o TypeScript Bundler globalmente para usá-lo como uma CLI:

```bash
npm install -g ts-bundler
```

## Instalação local

Alternativamente, você pode instalá-lo localmente em seu projeto:

```bash
npm install --save-dev ts-bundler
```

## Verificação de instalação

Para verificar se a instalação foi bem-sucedida, execute:

```bash
ts-bundler --version
```

ou para instalações locais:

```bash
npx ts-bundler --version
```
