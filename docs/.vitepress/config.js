
import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'TypeScript Bundler',
  description: 'Um bundler moderno para TypeScript com suporte a múltiplos formatos de módulos',
  base: '/',
  themeConfig: {
    logo: '/logo.png',
    nav: [
      { text: 'Início', link: '/' },
      { text: 'Guia', link: '/guide/installation' },
      { text: 'Plugins', link: '/plugins/' },
      { text: 'Roadmap', link: '/roadmap' },
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Guia',
          items: [
            { text: 'Instalação', link: '/guide/installation' },
            { text: 'Conceitos Básicos', link: '/guide/basic-concepts' },
          ]
        }
      ],
      '/plugins/': [
        {
          text: 'Plugins',
          items: [
            { text: 'Visão Geral', link: '/plugins/' },
            { text: 'API de Plugins', link: '/plugins/api' },
            { text: 'Criando Plugins', link: '/plugins/creating-plugins' },
            { text: 'Exemplos', link: '/plugins/examples' },
          ]
        }
      ]
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/yourusername/typescript-bundler' }
    ],
    footer: {
      message: 'Lançado sob a Licença MIT.',
      copyright: 'Copyright © 2022-presente'
    }
  }
});
