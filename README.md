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

---

## 🔐 Autenticação & E-mail (Magic Link)

O Nudge utiliza autenticação passwordless via **Magic Link**.

### Modo Desenvolvimento (Local)

Se a variável `RESEND_API_KEY` não estiver configurada no `.env.local`, a aplicação entra automaticamente em modo de desenvolvimento local:

- O link de autenticação e confirmação de cadastro é **impresso diretamente no seu terminal** onde o `npm run dev` está rodando:
  ```text
  =============================================================
  [Nudge Dev Auth] Confirmação de Cadastro para: seu@email.com
  URL: http://localhost:3000/auth/verify?token=...
  =============================================================
  ```
- Basta clicar no link ou colá-lo no navegador para acessar ou ativar sua conta instantaneamente.

### Envio Real de E-mail (Resend)

Para enviar e-mails reais para a caixa de entrada:

1. Obtenha uma chave gratuita em [resend.com](https://resend.com).
2. Adicione ao arquivo `.env.local`:
   ```env
   RESEND_API_KEY=re_sua_chave_aqui
   EMAIL_FROM=Nudge <onboarding@resend.dev>
   ```

---

## 🗄️ Banco de Dados (Amazon DynamoDB)

- **Modo Local:** Sem credenciais da AWS, a aplicação opera com um **fallback em memória**, permitindo testar e desenvolver sem necessidade de banco de dados ativo.
- **Configuração na AWS:** O Nudge utiliza _Single-Table Design_. O passo a passo completo para criar a tabela, ativar TTL e configurar chaves está documentado em:
  👉 [Guia de Configuração do DynamoDB](docs/dynamodb-setup.md)

---

## ⚙️ Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz com base no template `.env.example`:

| Variável                | Descrição                                 | Padrão / Obrigatório                     |
| :---------------------- | :---------------------------------------- | :--------------------------------------- |
| `APP_URL`               | URL base da aplicação                     | `http://localhost:3000`                  |
| `RESEND_API_KEY`        | Chave de API do Resend                    | Opcional em dev (imprime no terminal)    |
| `EMAIL_FROM`            | Remetente dos e-mails                     | `Nudge <onboarding@resend.dev>`          |
| `SESSION_SECRET`        | Chave para assinar cookies de sessão      | Opcional em dev (gerado automaticamente) |
| `AWS_REGION`            | Região da AWS do DynamoDB                 | `us-east-1`                              |
| `AWS_ACCESS_KEY_ID`     | Chave de acesso AWS                       | Opcional (ativa DynamoDB real)           |
| `AWS_SECRET_ACCESS_KEY` | Chave secreta AWS                         | Opcional (ativa DynamoDB real)           |
| `DYNAMODB_TABLE_NAME`   | Nome da tabela                            | `nudge_tasks`                            |
| `DYNAMODB_ENDPOINT`     | Endpoint customizado (ex: DynamoDB Local) | Opcional (`http://localhost:8000`)       |

---

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
