
# Configuração da GUI

Este guia fornece instruções para a configuração do ambiente de desenvolvimento da GUI do TypeScript Bundler usando Vue.js 3 e Vuetify 3.7.x.

## Requisitos

- Node.js 16 ou superior
- NPM 7 ou superior

## Estrutura de Diretórios

```
/gui
├── public/             # Arquivos estáticos
├── src/
│   ├── assets/         # Recursos (imagens, fontes, etc.)
│   ├── components/     # Componentes Vue reutilizáveis
│   ├── layouts/        # Layouts da aplicação
│   ├── plugins/        # Plugins Vue
│   ├── router/         # Configuração do Vue Router
│   ├── store/          # Gerenciamento de estado com Pinia
│   ├── styles/         # Estilos globais
│   ├── views/          # Componentes de página
│   ├── App.vue         # Componente raiz
│   ├── main.ts         # Ponto de entrada
│   └── vuetify.ts      # Configuração do Vuetify
├── .eslintrc.js        # Configuração do ESLint
├── index.html          # Template HTML
├── package.json        # Dependências
├── tsconfig.json       # Configuração do TypeScript
└── vite.config.ts      # Configuração do Vite
```

## Instalação

1. Clone o repositório
2. Instale as dependências:

```bash
cd gui
npm install
```

## Dependências Principais

```json
{
  "dependencies": {
    "vue": "^3.3.x",
    "vuetify": "^3.7.x",
    "vue-router": "^4.2.x",
    "pinia": "^2.1.x",
    "@mdi/font": "^7.2.x",
    "chart.js": "^4.3.x",
    "vue-chartjs": "^5.2.x"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^4.2.x",
    "typescript": "^5.0.x",
    "vite": "^4.3.x",
    "sass": "^1.62.x"
  }
}
```

## Configuração do Vuetify

```typescript
// src/plugins/vuetify.ts
import { createVuetify } from 'vuetify'
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

// Temas personalizados
const lightTheme = {
  dark: false,
  colors: {
    primary: '#1867C0',
    secondary: '#5CBBF6',
    accent: '#e91e63',
    success: '#4CAF50',
    warning: '#FB8C00',
    error: '#FF5252',
    info: '#2196F3'
  }
}

const darkTheme = {
  dark: true,
  colors: {
    primary: '#2196F3',
    secondary: '#424242',
    accent: '#FF4081',
    success: '#66BB6A',
    warning: '#FFA726',
    error: '#EF5350',
    info: '#42A5F5'
  }
}

export default createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'lightTheme',
    themes: {
      lightTheme,
      darkTheme
    }
  }
})
```

## Iniciando o Servidor de Desenvolvimento

```bash
npm run dev
```

## Compilando para Produção

```bash
npm run build
```

## Integração com TypeScript Bundler

A GUI se comunicará com o TypeScript Bundler através de:

1. API REST para operações assíncronas
2. WebSockets para atualizações em tempo real durante builds
3. Sistema de arquivos para leitura/escrita de configurações

## Considerações para Desenvolvimento

- Use a Composition API do Vue 3 para todos os componentes
- Utilize corretamente os componentes do Vuetify 3.7.x para manter consistência visual
- Siga as diretrizes de acessibilidade do Material Design
- Teste em diferentes tamanhos de tela para garantir responsividade
