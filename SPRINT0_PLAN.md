# Sprint 0 — Plano e decisões

## Decisões

- **Fonte de verdade do usuário:** Firestore `users/{uid}` (doc id = auth.uid). Um documento por usuário autenticado.
- **Role:** Campo `role` no doc Firestore; enforcement no app (ProtectedRoute por role). Regras Firestore: leitura em `users` para autenticados; escrita apenas em `users/{userId}` quando `request.auth.uid == userId`.
- **Criar usuário:** Fluxo por **convite (B)**. Coleção `invites` (email, role, token, createdBy, createdAt, usedAt). Admin gera convite e copia link; usuário acessa `/accept-invite?token=xxx`, define nome e senha; cria Auth + doc em `users/{uid}`.
- **Legado:** Docs em `users` com id aleatório permanecem; `getUsers` retorna todos; docs com `doc.id !== data.uid` (ou sem `uid`) tratados como legado na UI (badge "Sem login"). Exclusão por regras só no próprio doc; admin não exclui outros usuários pelo client (evitar regra permissiva).

## Impactos e migração

- **AuthContext:** Passa a usar `observeAuthState` no mount; sessão persiste após reload.
- **UserService:** Remove `createUser` com `addDoc`; `getUsers` normaliza todos os docs (id = doc.id, uid = doc.id quando for perfil); `updateUser(uid, data)` e `deleteUser(uid)` apenas para doc `users/{uid}`. Compatível com docs legados (somente leitura/lista).
- **Rotas:** `/users` exige role `admin`; Sidebar esconde "Usuários" para não-admin.
- **Regras:** Acesso anônimo bloqueado; `users`: leitura autenticada, escrita só no próprio doc; `machines`/`clusters`: leitura/escrita autenticada.
- **Migração de dados:** Nenhum script obrigatório. Usuários existentes com doc em `users/{uid}` seguem válidos; docs com id aleatório continuam listados como legado até eventual limpeza manual no console.
