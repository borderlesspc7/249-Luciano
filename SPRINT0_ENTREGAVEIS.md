# Sprint 0 — Entregáveis

## 1) Plano (resumo)

Ver **SPRINT0_PLAN.md**.

- **Fonte de verdade:** Firestore `users/{uid}` (doc id = auth.uid).
- **Role:** Campo no doc; RBAC no app (ProtectedRoute + Sidebar); regras Firestore restringem escrita ao próprio doc.
- **Criar usuário:** Convite (B). Coleção `invites`; admin gera link; usuário acessa `/accept-invite?token=xxx`, define nome e senha.
- **Legado:** Docs com id aleatório continuam listados; exclusão apenas do próprio doc (regras).

---

## 2) Lista de arquivos alterados / criados

### Criados

- `src/lib/logger.ts` — Logger central (erros + extensão Sentry).
- `src/services/inviteService.ts` — CRUD de convites.
- `src/pages/Users/InviteModal/InviteModal.tsx` — Modal “Convidar usuário”.
- `src/pages/Users/InviteModal/InviteModal.css`
- `src/pages/AcceptInvite/AcceptInvite.tsx` — Página aceitar convite (nome + senha).
- `src/pages/AcceptInvite/AcceptInvite.css`
- `firebase/firestore.rules` — Regras Firestore.
- `firebase/storage.rules` — Regras Storage.
- `FIREBASE_DEPLOY.md` — Passo a passo deploy das regras.
- `SPRINT0_PLAN.md` — Decisões e impacto.
- `SPRINT0_ENTREGAVEIS.md` — Este arquivo.

### Alterados

- `src/contexts/AuthContext.tsx` — Persistência de sessão com `observeAuthState`; logger em erros.
- `src/services/authService.ts` — `observeAuthState` retorna User normalizado; `acceptInvite`; `lastLogin` com Timestamp; logger.
- `src/services/userService.ts` — Removido `createUser` (addDoc); `getUsers` sem orderBy (compat legado); `updateUser(uid)` / `deleteUser(uid)`; logger.
- `src/components/Header/Header.tsx` — Nome e role reais do usuário.
- `src/components/Sidebar/Sidebar.tsx` — “Usuários” só para role admin.
- `src/routes/ProtectedRoutes.tsx` — `requiredRole?: "admin"` e redirect para `/menu` se não admin.
- `src/routes/AppRoutes.tsx` — Rota `/users` com `requiredRole="admin"`; rota `/accept-invite`.
- `src/routes/paths.ts` — `acceptInvite: "/accept-invite"`.
- `src/types/users.ts` — `role` obrigatório em `User`.
- `src/pages/Users/Users.tsx` — Convite no lugar de “Novo usuário”; delete só para própria conta; InviteModal + UserModal (só edição).
- `src/pages/CodeVerification/CodeVerification.tsx` — Implementação de `handleCodeChange` e uso de `setCode` (correção build).
- `src/pages/ForgotPassword/ForgotPassword.tsx` — Uso de `formData`/`setFormData` e `setLoading` (correção build).
- `src/pages/ResetPassword/ResetPassword.tsx` — Uso de `setLoading` (correção build).

---

## 3) Patches (unified diff)

Para obter os diffs completos após aplicar as mudanças:

```bash
git diff --no-color > sprint0-full.diff
# ou por arquivo:
git diff -- src/contexts/AuthContext.tsx
git diff -- src/services/authService.ts
# ... etc.
```

As alterações já estão aplicadas no repositório; os arquivos listados na seção 2 contêm o código final.

---

## 4) Regras Firebase e README

- **firebase/firestore.rules** — Acesso anônimo bloqueado; `users/{userId}` leitura para autenticados, escrita só se `request.auth.uid == userId`; `invites` leitura aberta (link), escrita autenticada; `machines` e `clusters` leitura/escrita autenticada.
- **firebase/storage.rules** — Leitura/escrita só para `request.auth != null`.
- **FIREBASE_DEPLOY.md** — Comandos: `firebase deploy --only firestore:rules`, `firebase deploy --only storage`, e opção `firebase deploy --only firestore:rules,storage`.

---

## 5) Testes rápidos (validação manual)

1. **Login persistente** — Fazer login, recarregar a página (F5). O usuário deve continuar logado e o Header deve mostrar nome e role corretos.
2. **Role no Header** — Com usuário “user”, o Header deve mostrar “Usuário”; com “admin”, “Administrador”.
3. **RBAC rota /users** — Com usuário “user”, acessar diretamente `/users`. Deve redirecionar para `/menu`. O item “Usuários” não deve aparecer na Sidebar.
4. **RBAC Sidebar** — Logado como “user”, conferir que o menu “Usuários” não aparece.
5. **Convite** — Logado como admin, em Usuários clicar “Convidar usuário”, preencher email e perfil, gerar link. Copiar link e abrir em aba anônima (ou outro navegador).
6. **Aceitar convite** — Na página `/accept-invite?token=...`, preencher nome e senha (≥ 6 caracteres), confirmar senha. Clicar “Criar conta”. Deve redirecionar para o menu com o novo usuário logado.
7. **Editar usuário** — Como admin, em Usuários editar um perfil (nome, role, status). Salvar e verificar se a lista atualiza.
8. **Excluir própria conta** — Como admin, na lista de usuários o botão de excluir deve estar ativo apenas na linha do próprio usuário. Clicar e confirmar; a conta deve ser excluída e o usuário deslogado.
9. **Regras Firestore** — Com o app deslogado (ou em aba anônima sem login), tentar uma ação que exija Firestore (ex.: abrir `/menu`). Deve redirecionar para login; nenhum dado deve ser lido sem auth.
10. **Logger** — Abrir o console do navegador; provocar um erro (ex.: login com senha errada). Deve aparecer um log estruturado `[App Error]` com message e contexto.

---

## Critérios de aceite (checklist)

- [x] Recarregar a página mantém o usuário logado e carrega perfil/role do Firestore.
- [x] Header mostra nome/email e role real (Administrador / Usuário).
- [x] Usuário “user” não acessa rotas admin (redirect + menu oculto).
- [x] Coleção `users` consistente: documentos por uid; services usam `users/{uid}`; convite gera Auth + doc.
- [x] Fluxo “criar usuário” por convite: admin gera link, usuário ativa conta em `/accept-invite`.
- [x] Regras Firestore/Storage impedem acesso anônimo e restringem por auth (e em users por próprio doc).
- [x] Logger central usado em falhas de login, registro e carregamento de perfil; ponto de extensão para Sentry comentado em `src/lib/logger.ts`.
