# Nudge

**Nudge** é um aplicativo focado em transformar pequenas ações
recorrentes em hábitos sustentáveis.

A proposta é ajudar o usuário a manter consistência em tarefas
obrigatórias do dia a dia --- desde cuidados pessoais até
micro-compromissos de longo prazo --- através de uma experiência
simples, fluida e mobile-first.

O projeto é construído como **Progressive Web App (PWA)** e pode ser
distribuído como aplicativo Android via **Trusted Web Activity (TWA)**.

---

## ✨ Funcionalidades

- Organização de micro-hábitos recorrentes
- Sistema leve de acompanhamento diário
- Experiência mobile-first
- Instalação como aplicativo no Android
- Suporte offline (PWA)
- Internacionalização (i18n)

---

## 🛠 Stack Técnica

- **React 19 + Vite**
- **TypeScript (strict mode)**
- **Zustand** (state management)
- **React Router v7**
- **Tailwind CSS**
- **Framer Motion**
- **i18next** (internacionalização)
- **Vitest + Testing Library**
- **vite-plugin-pwa**
- **Bubblewrap (TWA Android)**

---

## 🚀 Como Rodar Localmente

### Pré-requisitos

- Node.js 18+

### Instalar dependências

```bash
npm install
```

### Rodar em modo desenvolvimento

```bash
npm run dev
```

### Rodar testes

```bash
npm run test
```

Para cobertura de testes:

```bash
npm run test:coverage
```

### Gerar build de produção

```bash
npm run build
```

Visualizar build local:

```bash
npm run preview
```

---

## 📱 Distribuição Android (TWA)

O projeto pode ser empacotado como aplicativo Android utilizando
**Trusted Web Activity (TWA)** via Bubblewrap.

### Configuração

As configurações do aplicativo Android (nome, packageId, tema, ícones,
etc.) estão no:

`twa-manifest.template.json`

O arquivo real `twa-manifest.json` (que contém dados sensíveis como
`signingKey`) **não é versionado**, por segurança.

Em ambientes locais ou CI/CD, o `twa-manifest.json` deve ser gerado a
partir do template com as credenciais apropriadas.

### Gerar APK / AAB

Instale o CLI:

```bash
npm install -g @google/bubblewrap
```

Depois, utilize o Bubblewrap para inicializar ou atualizar o projeto
Android com base no `twa-manifest.json`.

---

## 🌐 PWA

O Nudge é um Progressive Web App com:

- Cache de assets
- Atualização automática
- Suporte offline
- Instalação nativa em dispositivos compatíveis

---

## 📄 Licença

© 2026 Carolina Oliveira. Todos os direitos reservados.

O código está disponível para visualização, mas não é permitido uso ou redistribuição sem autorização.
