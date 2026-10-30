# Configuração do Amazon DynamoDB para o Nudge

O Nudge utiliza uma arquitetura **Single-Table Design** no Amazon DynamoDB.

---

## 1. Estrutura da Tabela

- **Nome da Tabela Padrão:** `nudge_tasks`
- **Partition Key (PK):** `PK` (Tipo: String) — Formato: `HOUSEHOLD#<id>`
- **Sort Key (SK):** `SK` (Tipo: String) — Formatos: `PROFILE` e `TASK#<id>`

---

## 2. Como criar a tabela na AWS

### Via AWS CLI:

```bash
aws dynamodb create-table \
    --table-name nudge_tasks \
    --attribute-definitions \
        AttributeName=PK,AttributeType=S \
        AttributeName=SK,AttributeType=S \
    --key-schema \
        AttributeName=PK,KeyType=HASH \
        AttributeName=SK,KeyType=RANGE \
    --billing-mode PAY_PER_REQUEST
```

_(Ou modo Provisioned com 5 RCU e 5 WCU, ambos 100% dentro do Free Tier permanente da AWS)._

### Ativar Time to Live (TTL) para tokens de autenticação:

Para que tokens temporários de login sejam automaticamente removidos da tabela sem custos de escrita:

```bash
aws dynamodb update-time-to-live \
    --table-name nudge_tasks \
    --time-to-live-specification "Enabled=true, AttributeName=ttl"
```

---

## 3. Variáveis de Ambiente (`.env.local`)

Crie ou edite o arquivo `.env.local` na raiz do projeto:

```env
# AWS DynamoDB Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=sua_access_key_aqui
AWS_SECRET_ACCESS_KEY=seu_secret_key_aqui
DYNAMODB_TABLE_NAME=nudge_tasks

# Opcional: Se for usar DynamoDB Local (via Docker):
# DYNAMODB_ENDPOINT=http://localhost:8000
```

> **Nota de Desenvolvimento:** Se as variáveis da AWS não estiverem configuradas, a aplicação utiliza automaticamente um fallback em memória para que o ambiente de testes e desenvolvimento continue funcionando perfeitamente sem falhas.
