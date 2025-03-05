import { defineConfig } from "vitepress";

export default defineConfig({
  vite: {
    server: {
      host: "0.0.0.0",
      hmr: {
        clientPort: 443,
      },
      strictPort: true,
      // Permitir qualquer host do Replit
      allowedHosts: [
        ".replit.dev",
        ".repl.co",
        ".janeway.replit.dev",
        "156c72e2-f58c-4819-9fd5-55207b744554-00-1gyc1nwicj6j.spock.replit.dev",
      ],
    },
  },
  title: "TypeScript Bundler",
  description: "Documentação oficial do TypeScript Bundler",
  themeConfig: {
    nav: [
      { text: "Início", link: "/" },
      { text: "Guia", link: "/guide/" },
      { text: "Plugins", link: "/plugins/" },
      { text: "API", link: "/api/" },
      { text: "GUI", link: "/gui/" },
      { text: "Roadmap", link: "/roadmap" },
    ],
    sidebar: {
      "/guide/": [
        {
          text: "Guia",
          items: [
            { text: "Introdução", link: "/guide/" },
            { text: "Instalação", link: "/guide/installation" },
            { text: "Conceitos Básicos", link: "/guide/basic-concepts" },
            { text: "CLI", link: "/guide/cli" },
            { text: "Configuração", link: "/guide/configuration" },
            { text: "Mode de Observação", link: "/guide/watch-mode" },
            { text: "Estratégias de Bundling", link: "/guide/bundling-strategies" },
            { text: "Suporte Financeiro", link: "/guide/sponsorship" },
          ],
        },
      ],
      "/plugins/": [
        {
          text: "Plugins",
          items: [
            { text: "Introdução", link: "/plugins/" },
            { text: "Plugin API", link: "/plugins/api" },
            { text: "Criando Plugins", link: "/plugins/creating-plugins" },
            { text: "Marketplace", link: "/plugins/marketplace" },
            { text: "Exemplos", link: "/plugins/examples" },
          ],
        },
      ],
      "/api/": [
        {
          text: "API",
          items: [
            { text: "Visão Geral", link: "/api/" },
            { text: "Bundler", link: "/api/bundler" },
            { text: "Plugin Manager", link: "/api/plugin-manager" },
            { text: "Transformadores", link: "/api/transformers" },
          ],
        },
      ],
      "/gui/": [
        {
          text: "GUI",
          items: [
            { text: "Visão Geral", link: "/gui/" },
            { text: "Dashboard", link: "/gui/dashboard" },
            { text: "Gerenciador de Plugins", link: "/gui/plugins" },
            { text: "Configuração", link: "/gui/configuration" },
            { text: "Patrocínio", link: "/gui/sponsorship" },
          ],
        },
      ],
    },
    socialLinks: [
      { icon: "github", link: "https://github.com/seu-usuario/ts-bundler" },
    ],
    footer: {
      message: "Licenciado sob ISC",
      copyright: "Copyright © 2023",
    },
  },
});
