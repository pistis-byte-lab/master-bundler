
# Suporte Financeiro

O TypeScript Bundler oferece um sistema completo para que os desenvolvedores recebam suporte financeiro por seu trabalho através de patrocínios.

## Por que solicitar patrocínio?

Desenvolver e manter pacotes de código aberto exige tempo, esforço e dedicação. O suporte financeiro permite que os mantenedores:

- Dediquem mais tempo ao projeto
- Implementem novas funcionalidades mais rapidamente
- Forneçam melhor suporte aos usuários
- Melhorem a documentação e exemplos
- Garantam a sustentabilidade a longo prazo do projeto

## Funcionalidades do Sistema de Patrocínio

O TypeScript Bundler inclui:

- **Página de patrocínio personalizada**: HTML/CSS pronto para uso
- **Integração com plataformas populares**: GitHub Sponsors, Open Collective, Patreon, Ko-fi, Buy Me a Coffee
- **Sistema de níveis de patrocínio**: Configure diferentes níveis com benefícios específicos
- **Template de solicitação de suporte**: Gere facilmente páginas de patrocínio
- **Badge de projetos patrocinados**: Adicione um badge de patrocínio ao seu README
- **Estatísticas e relatórios**: Acompanhe e analise o crescimento do patrocínio

## Como Configurar Patrocínio

### 1. Comando CLI para Configuração Rápida

```bash
ts-bundler sponsor setup
```

Este comando guiará você através de um processo interativo para configurar seu perfil de patrocínio, incluindo níveis, benefícios e integrações com plataformas.

### 2. Configuração Manual

Adicione uma seção `sponsor` ao seu arquivo `tsbundler.config.js`:

```javascript
module.exports = {
  // Configurações do bundler...
  
  sponsor: {
    name: "Seu Nome",
    description: "Uma breve descrição do seu projeto e por que merece patrocínio",
    links: {
      github: "https://github.com/sponsors/seu-usuario",
      openCollective: "https://opencollective.com/seu-projeto",
      patreon: "https://patreon.com/seu-usuario",
      custom: "https://seu-site.com/doar"
    },
    tiers: [
      {
        name: "Apoiador",
        amount: 5,
        benefits: ["Seu nome no README"]
      },
      {
        name: "Patrocinador Prata",
        amount: 25,
        benefits: ["Seu nome no README", "Acesso a repositório privado com recursos avançados"]
      },
      {
        name: "Patrocinador Ouro",
        amount: 100,
        benefits: ["Seu logo no README", "Suporte prioritário", "Consultoria mensal (1h)"]
      }
    ],
    featuredSponsors: [
      {
        name: "Empresa Exemplo",
        logo: "./sponsors/empresa-exemplo.png",
        url: "https://exemplo.com"
      }
    ]
  }
};
```

## Página de Patrocínio Gerada

O TypeScript Bundler gera automaticamente uma página de patrocínio em HTML que você pode incorporar em seu site ou documentação:

```bash
ts-bundler sponsor generate --output ./public/sponsor.html
```

## Integração com GitHub Sponsors

Configure facilmente a integração com GitHub Sponsors:

```bash
ts-bundler sponsor github seu-usuario-github
```

## Badge de Patrocinador

Adicione um badge de patrocínio ao seu README:

```markdown
[![Patrocine este projeto](https://img.shields.io/badge/Patrocine-TypeScript%20Bundler-brightgreen)](https://seu-site.com/sponsor.html)
```

## Estatísticas e Relatórios

Acompanhe suas estatísticas de patrocínio:

```bash
ts-bundler sponsor stats
```

## Integração com Plataformas Populares

O TypeScript Bundler oferece integração direta com:

- GitHub Sponsors
- Open Collective
- Patreon
- Ko-fi
- Buy Me a Coffee

## Personalização Avançada

Para necessidades de personalização mais avançadas, você pode modificar o template HTML diretamente:

```bash
# Primeiro, extraia o template padrão
ts-bundler sponsor generate --output ./meu-template.html

# Modifique o template conforme necessário

# Use seu template personalizado
ts-bundler sponsor generate --template ./meu-template.html --output ./public/sponsor.html
```

## Próximos Passos

Consulte a [seção de GUI](/gui/sponsorship) para saber mais sobre os recursos visuais de gerenciamento de patrocínio disponíveis na interface gráfica.
