# Deploy das regras Firebase (Firestore e Storage)

## Pré-requisitos

- Node.js instalado
- Conta Firebase e projeto criado no [Console Firebase](https://console.firebase.google.com)
- Firebase CLI instalado: `npm install -g firebase-tools`
- Login: `firebase login`
- Projeto vinculado na pasta do app (raiz do repositório): `firebase use <project-id>`

## Estrutura no repositório

```
firebase/
  firestore.rules      # Regras do Firestore
  firestore.indexes.json # Índices compostos (obrigatório para queries com where + orderBy)
  storage.rules        # Regras do Storage (acesso autenticado)
```

## Comandos de deploy

### Apenas regras do Firestore

```bash
firebase deploy --only firestore:rules
```

### Índices do Firestore (obrigatório para o Dashboard e listagens)

Queries com `where` + `orderBy` em campos diferentes exigem índice composto. Sem o deploy dos índices, o Dashboard (e outras telas) falham com erro “The query requires an index”.

```bash
firebase deploy --only firestore:indexes
```

Na primeira vez, os índices ficam “Building” no [Console Firebase](https://console.firebase.google.com) → Firestore → Índices; pode levar alguns minutos. Só depois disso as queries passam a funcionar.

### Regras + índices do Firestore de uma vez

```bash
firebase deploy --only firestore
```

### Apenas regras do Storage

```bash
firebase deploy --only storage
```

### Firestore e Storage de uma vez

```bash
firebase deploy --only firestore:rules,storage
```

### Deploy completo (se houver hosting/functions no futuro)

```bash
firebase deploy
```

## Primeira vez (inicializar Firebase no projeto)

1. Na raiz do repositório: `firebase init`
2. Escolha **Firestore** e **Storage** (e Hosting se for publicar o app).
3. Quando perguntar pelo arquivo de regras do Firestore, use `firebase/firestore.rules`.
4. Quando perguntar pelo arquivo de regras do Storage, use `firebase/storage.rules`.
5. Depois disso, use os comandos acima para publicar alterações nas regras.

## Resumo das regras (hardening mínimo)

- **Firestore**
  - Acesso anônimo: **bloqueado** (todas as regras exigem `request.auth != null`, exceto leitura em `invites` para aceitar convite por link).
  - `users/{userId}`: leitura para autenticados; criação/atualização/exclusão apenas quando `request.auth.uid == userId`.
  - `invites`: leitura aberta (link de convite); criação/atualização/exclusão apenas autenticados.
  - `machines` e `clusters`: leitura e escrita apenas autenticados.

- **Storage**
  - Leitura e escrita apenas para usuários autenticados.
