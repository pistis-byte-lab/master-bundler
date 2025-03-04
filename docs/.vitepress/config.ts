
import { defineConfig } from 'vitepress'

export default defineConfig({
  vite: {
    server: {
      host: '0.0.0.0',
      hmr: {
        clientPort: 443
      },
      strictPort: true,
      // Permitir qualquer host do Replit
      allowedHosts: ['.replit.dev', '.repl.co', '.janeway.replit.dev'],
    }
  },
  title: "TypeScript Bundler",
  description: "Documentação oficial do TypeScript Bundler",
  themeConfig: {
    nav: [
      { text: 'Início', link: '/' },
      { text: 'Guia', link: '/guide/' },
      { text: 'Plugins', link: '/plugins/' },
      { text: 'API', link: '/api/' },
      { text: 'Roadmap', link: '/roadmap' }
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Guia',
          items: [
            { text: 'Introdução', link: '/guide/' },
            { text: 'Instalação', link: '/guide/installation' },
            { text: 'Conceitos Básicos', link: '/guide/basic-concepts' },
            { text: 'CLI', link: '/guide/cli' },
            { text: 'Configuração', link: '/guide/configuration' },
            { text: 'Mode de Observação', link: '/guide/watch-mode' }
          ]
        }
      ],
      '/plugins/': [
        {
          text: 'Plugins',
          items: [
            { text: 'Introdução', link: '/plugins/' },
            { text: 'Plugin API', link: '/plugins/api' },
            { text: 'Criando Plugins', link: '/plugins/creating-plugins' },
            { text: 'Exemplos', link: '/plugins/examples' }
          ]
        }
      ],
      '/api/': [
        {
          text: 'API',
          items: [
            { text: 'Visão Geral', link: '/api/' },
            { text: 'Bundler', link: '/api/bundler' },
            { text: 'Plugin Manager', link: '/api/plugin-manager' },
            { text: 'Transformadores', link: '/api/transformers' }
          ]
        }
      ]
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/seu-usuario/ts-bundler' }
    ],
    footer: {
      message: 'Licenciado sob ISC',
      copyright: 'Copyright © 2023'
    }
  }
})
