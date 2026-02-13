# Panorama do Projeto vs Escopo do Cliente

**Projeto:** Aplicativo para Formalização de Processos de Comissionamento e Validação de Instalações  
**Data do levantamento:** 13/02/2025  
**Repositório analisado:** 249-Luciano (Sistema Singenta)

---

## 1) Foto geral do projeto

O que existe hoje é uma **aplicação web** (SPA) em React + TypeScript + Vite, batizada no código como "Sistema Singenta". Os **módulos principais** são: autenticação (login, registro, esqueci senha, reset senha, verificação de código), dashboard com indicadores agregados, gestão de máquinas/processos (CRUD com clusters), e gestão de usuários (CRUD com perfis admin/user e status). **Não há app mobile (iOS/Android)** nem backend monolítico separado: o backend é o **Firebase** (Auth, Firestore, Storage configurado mas pouco usado).

O **estado atual** é de **MVP/beta web**: funcional para cadastro de máquinas, usuários e visualização de dashboard, mas **sem** fluxo de comissionamento/validação, etapas, aprovações multiusuário, evidências, assinaturas, relatórios PDF ou certificados. Métricas de "testes" e "projetos" no dashboard são **simuladas** a partir das máquinas (comentários no código: "Em produção, isso viria de uma coleção 'tests' no Firestore").

**Stakeholders/usuários** implícitos: quem faz login acessa o mesmo menu (Dashboard, Máquinas, Usuários). Há roles **admin** e **user** no modelo de dados, mas **não há restrição de telas por perfil** nas rotas (qualquer logado acessa tudo). O fluxo hoje é: login → menu (dashboard) → cadastro/edição de máquinas ou usuários; não existe fluxo de “comissionamento” ou “validação” com etapas e aprovações.

---

## 2) Stack e arquitetura (com evidências)

| Camada | Tecnologia | Evidência |
|--------|------------|-----------|
| **Frontend web** | React 19, TypeScript, Vite 7, React Router 7, react-icons | `package.json`, `src/App.tsx`, `src/routes/AppRoutes.tsx` |
| **Estrutura frontend** | Páginas em `src/pages/`, componentes em `src/components/`, serviços em `src/services/`, tipos em `src/types/`, rotas em `src/routes/`, contextos em `src/contexts/`, hooks em `src/hooks/` | Estrutura de pastas em `src/` |
| **Mobile** | Nenhum (sem Flutter, React Native ou app nativo) | Ausência de pasta `android/`, `ios/`, `flutter/`, ou config mobile no repo |
| **Backend** | Firebase (Auth + Firestore + Storage) — sem servidor próprio | `src/lib/firebaseconfig.ts`, `src/services/authService.ts`, `machineService.ts`, `userService.ts` |
| **Autenticação** | Firebase Auth (e-mail/senha); dados de perfil em Firestore `users` | `authService.ts`: `login`, `register`, `observeAuthState` (não usado no AuthContext) |
| **Banco de dados** | Firestore. Coleções: `users`, `machines`, `clusters` | `machineService.ts` (MACHINES_COLLECTION, CLUSTERS_COLLECTION), `userService.ts` (USERS_COLLECTION), `authService` lê `users` |
| **Hospedagem** | Não definida no repo (apenas build Vite) | `package.json`: `"build": "tsc -b && vite build"`; sem config de deploy |
| **Integrações** | Nenhuma (ERP, manutenção, nuvem externa) | Nenhum serviço ou env de API externa encontrado |
| **ADRs / diagramas** | Nenhum | Nenhum arquivo em `docs/` ou `ADR*` |

### 2.1 Regras de segurança Firestore/Storage e modelagem de permissões no backend

- **Regras no repositório:** ❌ **Não aparecem.** Não existe arquivo `firestore.rules`, `storage.rules` nem pasta `firebase/` ou `.firebaserc` com regras versionadas no projeto. O acesso ao Firestore e ao Storage é feito apenas pelo SDK no cliente (frontend), com as credenciais do projeto (API key no `.env`). Qualquer regra ativa hoje está apenas no console do Firebase (Firebase Console), **fora do controle de versão do repo**.
- **Modelagem de permissões no backend:** Não há camada de backend própria (nem Cloud Functions, nem API). A "permissão" resume-se a: (1) **Firebase Auth** — só usuários autenticados podem chamar o SDK; (2) **no app**, `ProtectedRoute` só verifica se há usuário logado, sem distinguir role. Não há regras do tipo "só admin pode escrever em X" ou "user só lê a própria organização" definidas em Firestore Rules no repo. Para o escopo (RBAC, auditoria, LGPD), isso é uma lacuna: sem regras versionadas e sem backend, não há como garantir no servidor quem pode ler/escrever o quê.
- **Recomendação:** Incluir no repo pelo menos `firestore.rules` e `storage.rules` (por exemplo em `firebase/firestore.rules` e `firebase/storage.rules`) e documentar no README que o deploy das regras é feito via Firebase CLI; definir regras que restrinjam leitura/escrita por `request.auth` e, se possível, por um claim de role (custom claims no Auth) quando RBAC for implementado.

### 2.2 Modelo de dados (document schema) e exemplos de documentos

Coleções e formatos reais usados no código (Firestore grava `Timestamp` para datas; o app converte com `.toDate()`).

**Coleção `machines`** (id = auto-gerado por `addDoc`)

| Campo        | Tipo Firestore | Obrigatório | Descrição |
|-------------|----------------|-------------|-----------|
| `name`      | string         | sim         | Nome da máquina/processo |
| `type`      | string         | sim         | `"machine"` \| `"process"` |
| `status`    | string         | sim         | `"active"` \| `"inactive"` \| `"maintenance"` (default `"active"` na criação) |
| `description` | string       | não         | Texto livre |
| `clusterId` | string         | não         | ID do doc em `clusters` |
| `clusterName` | string       | não         | Nome do cluster (denormalizado na escrita/atualização) |
| `createdAt` | Timestamp      | sim         | |
| `updatedAt` | Timestamp      | sim         | |
| `createdBy` | string         | sim         | UID do usuário (Firebase Auth) |
| `updatedBy` | string         | sim         | UID do usuário |

Exemplo de documento:

```json
{
  "name": "Bomba HP-01",
  "type": "machine",
  "status": "active",
  "description": "Bomba de alta pressão",
  "clusterId": "abc123",
  "clusterName": "Linha 1",
  "createdAt": "<Timestamp>",
  "updatedAt": "<Timestamp>",
  "createdBy": "uidAuth123",
  "updatedBy": "uidAuth123"
}
```

**Coleção `clusters`** (id = auto-gerado)

| Campo        | Tipo Firestore | Obrigatório |
|-------------|----------------|-------------|
| `name`      | string         | sim         |
| `description` | string       | não         |
| `createdAt` | Timestamp      | sim         |
| `updatedAt` | Timestamp      | sim         |
| `createdBy` | string         | sim         |

Exemplo:

```json
{
  "name": "Linha 1",
  "description": "Agrupamento linha de produção 1",
  "createdAt": "<Timestamp>",
  "updatedAt": "<Timestamp>",
  "createdBy": "uidAuth123"
}
```

**Coleção `users`** — dois usos no código (inconsistência):

- **Perfil de autenticação (Auth):** documento com ID = **Firebase Auth UID** (`doc(db, "users", firebaseUser.uid)`). Escrito por `authService.register` e `authService.login` (atualiza `lastLogin`). Campos lidos/escritos: `uid`, `email`, `name`, `createdAt`, `updatedAt`, `role`; no login também `lastLogin` (não está em `User` type; auth grava como está).
- **Gestão de usuários (UserManagement):** documentos com ID **auto-gerado** por `addDoc(collection(db, "users", ...))` em `UserService.createUser`. Campos: `name`, `email`, `role`, `status`, `phone?`, `createdAt`, `updatedAt`, `createdBy`, `updatedBy`, `lastLoginAt?`.

Ou seja, a coleção `users` mistura (1) um doc por UID (perfil do Auth) e (2) docs com ID aleatório (lista de "usuários" da tela de gestão). O tipo `User` (Auth) não tem `status` nem `createdBy`; o tipo `UserManagement` tem `id` (doc id), `status`, etc. Exemplo de **doc de perfil Auth** (`users/{uid}`):

```json
{
  "uid": "uidAuth123",
  "email": "admin@empresa.com",
  "name": "Admin",
  "createdAt": "<Timestamp>",
  "updatedAt": "<Timestamp>",
  "role": "admin"
}
```

Exemplo de **doc de gestão** (quando usado como lista em UserService; id do doc é gerado pelo Firestore):

```json
{
  "name": "João Silva",
  "email": "joao@empresa.com",
  "role": "user",
  "status": "active",
  "phone": "(11) 99999-9999",
  "createdAt": "<Timestamp>",
  "updatedAt": "<Timestamp>",
  "createdBy": "uidAdmin",
  "updatedBy": "uidAdmin",
  "lastLoginAt": "<Timestamp>"
}
```

**Resumo:** `machines` e `clusters` têm schema estável e único. `users` tem dois padrões (por UID e por doc auto-gerado) no mesmo nome de coleção; isso pode colidir se um mesmo e-mail/UID for usado nos dois fluxos. Recomenda-se separar em `users` (só perfil por UID) e `userManagement` ou `profiles` (lista gerida pelo admin), ou unificar o modelo e a criação (ex.: criar sempre via Auth + doc em `users/{uid}`).

### 2.3 Estado de tempo real (realtime) — abrangência

- **Onde há subscribe (tempo real):**
  - **Dashboard:** `DashboardService.subscribeToDashboardStats` chama `MachineService.subscribeToMachines`, que usa **`onSnapshot`** na coleção **`machines`**, com query `orderBy("createdAt", "desc")`. Ou seja, **apenas a coleção `machines`** é ouvida em tempo real; **todos os campos** dos documentos retornados são usados (id, name, type, status, description, clusterId, clusterName, createdAt, updatedAt, createdBy, updatedBy). O dashboard reage a qualquer mudança em `machines` (incluindo criações/edições/exclusões) sem recarregar a página.
  - **Auth:** `authService.observeAuthState` usa `onAuthStateChanged` (estado de login/logout), mas **não é usado** no `AuthContext` ao montar o app; por isso a sessão não é restaurada em tempo real após reload.

- **Onde não há tempo real (somente leitura sob demanda):**
  - **Página Máquinas:** usa `MachineService.getMachines()` e `MachineService.getClusters()` (**getDocs**). Lista de máquinas e clusters é carregada ao abrir a página; alterações feitas noutra aba ou por outro usuário não aparecem até recarregar ou reabrir a tela.
  - **Página Usuários:** usa `UserService.getUsers()` (**getDocs**). Mesmo comportamento: sem live update.
  - **Login/registro:** leitura/escrita pontual em `users` e Auth; sem listener contínuo no Firestore.

**Resumo:** Tempo real hoje existe **só no dashboard**, e **só via coleção `machines`** (todos os campos da query). O resto do app (Máquinas, Usuários, AuthContext) não usa listeners; é tudo sob demanda (getDocs/getDoc) ou evento de Auth isolado.

### 2.4 Decisão de arquitetura: Firebase-only vs API REST/GraphQL

O escopo do cliente pede "backend com APIs REST/GraphQL". Hoje o backend é **apenas Firebase** (Auth + Firestore + Storage), sem uma API própria.

- **Manter só Firebase (Firebase-only):**
  - **Prós:** Menos custo e complexidade, menos infra para manter, tempo real nativo (onSnapshot), adequado para MVP e para times pequenos.
  - **Contras:** Regras e RBAC ficam limitados ao que Firestore Rules e Auth permitem; integrações (ERP, outros sistemas) teriam que falar direto com Firestore ou usar Cloud Functions; auditoria, validações complexas e LGPD (retenção, exclusão, logs) são mais difíceis de centralizar sem uma camada própria.

- **Introduzir uma API (REST ou GraphQL) na frente:**
  - **Prós:** Controle fino de RBAC, auditoria em um só lugar, integrações via API, relatórios/PDF e jobs pesados no servidor, conformidade (LGPD, ISO) mais fácil de documentar e implementar.
  - **Contras:** Mais desenvolvimento e operação (servidor ou serverless), possível perda de "realtime" puro se o cliente passar a consumir só a API (a menos que a API seja usada só para escritas e integrações, e o cliente continue usando o SDK para leituras em tempo real).

**Recomendação:**

1. **Curto prazo (MVP/validação):** Manter **Firebase-only**, mas **versionar regras** (Firestore + Storage) no repo e documentar o deploy; corrigir o modelo de `users` e persistir sessão no AuthContext com `observeAuthState`. Isso atende a entrega rápida sem comprometer o futuro.
2. **Médio prazo (escopo completo):** Introduzir uma **camada de API** (REST ou GraphQL) — por exemplo **Cloud Functions** ou um serviço Node/Express — que: (a) seja o único ponto de escrita para dados sensíveis (aprovações, usuários, auditoria); (b) aplique RBAC e registre auditoria; (c) sirva integrações (ERP) e geração de relatórios/PDF. O frontend pode continuar usando Firestore em tempo real para **leituras** (dashboard, listas) e passar a usar a API para **escritas** e ações que exijam regra de negócio ou auditoria. Assim o escopo "backend com APIs REST/GraphQL" fica atendido sem perder os benefícios de realtime onde fizer sentido.
3. **Documentar** no README ou em um ADR que a decisão atual é "Firebase-only para o MVP" e que a introdução da API está prevista para a fase de escopo completo (com integrações e conformidade).

---

## 3) Mapa “escopo do cliente” vs “entregue” (tabela)

| Item do escopo | Status | O que foi implementado | Onde está | Evidência | Observações |
|----------------|--------|------------------------|-----------|-----------|-------------|
| App mobile iOS/Android | ❌ Não feito | — | — | — | Só existe web. |
| App web | ✅ Feito | SPA responsiva com login, dashboard, máquinas, usuários | `src/` | Rotas em `AppRoutes.tsx`, layout em `Layout.tsx` | Nome interno: "Sistema Singenta". |
| Cadastro de projetos | ❌ Não feito | Não existe entidade "projeto"; dashboard deriva "total de projetos" das máquinas | `dashboardService.ts` (calculateProjectMetrics) | Comentário: "cada 2-3 máquinas formam um projeto" | Projetos não são cadastráveis. |
| Cadastro de equipamentos/componentes | 🟡 Parcial | Máquinas e processos (tipo machine/process) com nome, status, cluster, descrição; clusters como agrupamento | `src/pages/Machines/`, `src/types/machines.ts`, `machineService.ts` | CRUD em `Machines.tsx`, `MachineModal.tsx` | Equipamentos ≈ máquinas; "componentes" não existem como entidade. |
| Etapas do comissionamento | ❌ Não feito | — | — | — | Não há etapas nem fluxo de comissionamento. |
| Validação/aprovação multiusuário com auditoria | ❌ Não feito | — | — | — | Apenas createdBy/updatedBy em máquinas/usuários; sem fluxo de aprovação nem trilha de auditoria. |
| Evidências (fotos/docs/assinaturas) | ❌ Não feito | Firebase Storage importado mas não usado para evidências | `firebaseconfig.ts` (getStorage) | Nenhum upload de foto/doc ou assinatura no código | — |
| UI responsiva | ✅ Feito | Layout responsivo, sidebar colapsável, design mobile-first citado no README | `src/components/Layout/`, `Sidebar`, `Header`, CSS das páginas | `README.md`, `Layout.tsx`, `Sidebar.css` | — |
| Módulo offline com sync | ❌ Não feito | — | — | — | Nenhum service worker, PWA ou fila de sync. |
| Checklists/formulários customizáveis | ❌ Não feito | Formulários fixos (máquina, usuário); sem builder de checklist | `MachineModal.tsx`, `UserModal.tsx` | — | — |
| Assinatura eletrônica | ❌ Não feito | — | — | — | — |
| Relatórios automáticos (PDF certificado) | ❌ Não feito | — | — | — | — |
| Dashboard com indicadores | ✅ Feito | Cards (projetos, máquinas, testes concluídos/pendentes/falhos/atraso), progresso % e atividades recentes | `src/pages/Dashboard/Dashboard.tsx`, `StatCard`, `RecentActivities` | `dashboardService.ts`, `Dashboard.css` | Métricas de testes/projetos são simuladas a partir de máquinas. |
| Análise gráfica | 🟡 Parcial | Apenas “progresso” em círculo + números no dashboard; sem gráficos (ex.: Chart.js) | `Dashboard.tsx` (progress-chart) | — | Gráficos limitados. |
| Notificações automáticas | ❌ Não feito | — | — | — | Firebase messaging configurado no env, não usado no app. |
| Histórico de interações | 🟡 Parcial | "Atividades recentes" derivadas de máquinas (ex.: "Máquina X cadastrada"); não é histórico de interações completo | `RecentActivities.tsx`, `dashboardService.buildRecentActivityFromMachines` | — | Não é histórico de ações do usuário (quem fez o quê, quando). |
| RBAC por níveis | 🟡 Parcial | Roles admin/user no modelo e na gestão de usuários; sem restrição de rotas/telas por perfil | `userManagement.ts`, `Users.tsx`, `ProtectedRoute` não verifica role | — | Header mostra "Administrador" fixo; qualquer logado acessa todas as telas. |
| LGPD | ❓ Desconhecido | Nenhuma menção a bases legais, consentimento, retenção ou exclusão no código | — | — | Precisa ser fornecido: política, tratamento de dados, exclusão. |
| Certificação digital para aprovações/assinaturas | ❌ Não feito | — | — | — | — |
| Arquitetura modular | ✅ Feito | Separação services/pages/components/types/routes | `src/` | — | — |
| Backend APIs REST/GraphQL | 🟡 Parcial | Backend é Firebase (Firestore REST sob o SDK); não há APIs REST/GraphQL próprias | — | — | Cliente pediu "backend com APIs REST/GraphQL"; hoje é só Firebase. |
| BD com HA/recuperação | ❓ Desconhecido | Depende do Firebase (HA do serviço); sem evidência de regras de backup/recuperação no projeto | — | — | Fornecer se houver requisitos específicos. |
| Integrações (ERP, nuvem) | ❌ Não feito | — | — | — | — |
| Normas ISO 9001 / acessibilidade WCAG | ❓ Desconhecido | README cita "Acessibilidade (ARIA labels, navegação por teclado)"; sem doc de conformidade ISO/WCAG | `README.md` | — | Verificar se há documento de conformidade. |
| Documentação (requisitos, wireframes, manuais) | ❓ Desconhecido | Apenas README de desenvolvimento; sem pasta docs/, requisitos ou manuais no repo | — | — | Fornecer se existir em outro repositório ou pasta. |
| Testes de aceitação sandbox | ❌ Não feito | Nenhum teste e2e/unitário no repo; sem configuração de sandbox documentada | — | — | — |
| Validação módulos de segurança | ❓ Desconhecido | — | — | — | Fornecer se existir. |
| Suporte 12 meses | ❓ Desconhecido | Fora do escopo do código | — | — | Contrato/comercial. |

---

## 4) Fluxos e telas implementadas

| Tela | Rota | Ações | Perfis que usam | Dependências | Pendências |
|------|------|--------|------------------|--------------|------------|
| Login | `/`, `/login` | Login com e-mail/senha, link esqueci senha, link registro | Todos | Firebase Auth, Firestore `users` | Persistência de sessão: AuthContext não usa `observeAuthState` ao montar (user pode se perder ao recarregar). |
| Registro | `/register` | Cadastro nome, e-mail, senha, role (admin/user) | Todos | Firebase Auth, Firestore `users` | — |
| Esqueci senha | `/forgot-password` | Envio de e-mail de recuperação | Todos | Firebase Auth | Comentário no código: "mudar para tela de confirmação do código após implementar". |
| Código verificação | `/code-verification` | Entrada de código (fluxo reset) | Todos | — | Integração com reset real a confirmar. |
| Reset senha | `/reset-password` | Nova senha | Todos | Firebase Auth | — |
| Menu / Dashboard | `/menu` | Visualização de cards e atividades recentes | Qualquer logado (sem checagem de role) | `DashboardService`, `MachineService` (Firestore) | Métricas simuladas; sem restrição por perfil. |
| Máquinas | `/machines` | Listar, filtrar (tipo, status, busca), criar, editar, excluir máquina/processo; seleção de cluster | Qualquer logado | `MachineService`, Firestore `machines`, `clusters` | Clusters só criados via código (sem tela de CRUD de clusters no menu). |
| Usuários | `/users` | Listar, filtrar (perfil, status, busca), criar, editar, excluir usuário; cards de totais | Qualquer logado | `UserService`, Firestore `users` | CreateUser envia senha no modal mas UserService não usa Firebase Auth para criar usuário (inconsistência: doc em `users` sem conta Auth?). |
| Layout (Sidebar + Header) | Envolve menu, machines, users | Navegação, busca (UI apenas), logout, toggle sidebar | Qualquer logado | `useAuth` | Header exibe "Administrador" fixo; busca não implementada. |

**Dependências comuns:** Firebase (env em `.env`: VITE_FIREBASE_*). Proteção: `ProtectedRoute` apenas verifica se há `user` (não role).

---

## 5) Offline e sincronização

- **Modo offline:** ❌ Não existe. Não há service worker, PWA (manifest, installability) nem cache local de dados.
- **Sincronização:** N/A. Firestore usa persistência em disco por padrão no SDK web em alguns contextos, mas não há fila de ações offline nem UI indicando "offline" ou "sincronizando".
- **Conflitos:** Não há regras de resolução de conflitos.
- **O que falta:** Implementar PWA/offline (cache, fila de writes, indicador de status), e política de sync/conflitos.

---

## 6) Assinaturas, evidências e auditoria

- **Assinaturas:** ❌ Nenhuma. Não há captura (desenhada, certificado digital, biometria).
- **Evidências (fotos/anexos):** ❌ Não implementado. Firebase Storage está configurado em `firebaseconfig.ts` mas não há upload nem metadados de evidências em máquinas/comissionamento.
- **Trilha de auditoria:** ❌ Não há log de eventos (quem, quando, o quê, antes/depois). Apenas `createdBy`, `updatedBy`, `createdAt`, `updatedAt` em máquinas e usuários — insuficiente para auditoria completa.

---

## 7) Segurança e conformidade (LGPD, RBAC, logs)

- **RBAC:** Dois papéis (`admin`, `user`) em `users` e na gestão de usuários. **Não há** regras por tela/rota/recurso: todas as rotas protegidas são acessíveis a qualquer usuário logado. Header mostra role fixo "Administrador".
- **Autenticação:** E-mail/senha (Firebase Auth). Sem SSO, sem MFA.
- **LGPD:** Nenhuma implementação visível (bases legais, consentimento, retenção, exclusão, logs de acesso a dados pessoais).
- **Storage:** Firestore/Storage via Firebase; sem criptografia adicional ou controle de acesso documentado no app.
- **Certificação digital:** ❌ Não existe para assinaturas ou aprovações.

---

## 8) Relatórios, PDFs, certificados e dashboards

- **Relatórios/PDFs/certificados:** ❌ Nenhum. Não há geração de PDF, relatório automático nem certificado.
- **Dashboard:** Existe em `/menu`: cards (Projetos ativos, Máquinas, Testes concluídos/pendentes/falhos/atraso), bloco de progresso (%) e atividades recentes. Atualização em tempo real via `subscribeToDashboardStats` (Firestore onSnapshot). Gráficos: apenas representação de progresso (círculo + números), sem lib de gráficos.
- **Não conformidades:** Não há conceito de "não conformidade" nem gestão; não entra em relatórios.

---

## 9) Notificações e histórico de interações

- **Notificações:** ❌ Nenhuma. Firebase Messaging (sender id no .env) não é usado para push; não há notificações in-app nem por e-mail.
- **Histórico de interações:** "Atividades recentes" no dashboard lista eventos derivados de máquinas (ex.: "Máquina X cadastrada"), com tipo, título, descrição, timestamp e userName. Não é um histórico completo de ações do usuário (audit log).

---

## 10) Qualidade, testes e entrega

- **Testes:** ❌ Nenhum. Não há Jest, Vitest, Cypress, Playwright nem arquivos `*.test.*` / `*.spec.*`.
- **CI/CD:** ❌ Nenhum. Não existe `.github/workflows/` ou pipeline de build/test/deploy.
- **Sandbox:** Nenhum documento ou script para rodar ambiente de aceitação; apenas `.env` com chaves Firebase.
- **Plataformas:** **Web:** build Vite; deploy não configurado no repo. **Android/iOS:** não existem.

---

## 11) Riscos, débitos e próximos passos

**Bloqueios em relação ao escopo:**
1. Não há app mobile (escopo exige iOS/Android).
2. Não há fluxo de comissionamento/validação com etapas e aprovações.
3. Não há evidências (fotos/docs) nem assinaturas.
4. Não há relatórios PDF/certificados.
5. RBAC não aplicado (qualquer logado acessa tudo).
6. Sessão: AuthContext não subscreve `observeAuthState`, podendo perder usuário ao recarregar.
7. CreateUser (UserModal) pode criar documento em `users` sem criar usuário no Firebase Auth (senha não usada no auth).

**Dívida técnica:**
- Persistência de sessão no AuthContext (usar `authService.observeAuthState` no mount).
- Role no Header fixo; aplicar role real e restringir rotas por perfil.
- Criar usuário: alinhar criação no Firestore com Firebase Auth (ou fluxo de convite).
- CRUD de clusters: hoje só existe no service; falta tela no menu ou remover do escopo.
- Métricas do dashboard: trocar simulação por dados reais (ex.: coleção `tests`, `projects`).

**Próximas 10 ações recomendadas (impacto/urgência):**

| # | Ação | Impacto | Urgência |
|---|------|---------|----------|
| 1 | Persistir sessão no AuthContext com `observeAuthState` | Alto | Alta |
| 2 | Implementar restrição de rotas por role (RBAC) e exibir role real no Header | Alto | Alta |
| 3 | Definir e implementar entidade Projeto e telas de cadastro | Alto | Alta |
| 4 | Implementar etapas de comissionamento e fluxo de aprovação (workflow) | Alto | Alta |
| 5 | Adicionar evidências (fotos/docs) e armazenar no Storage com referência no Firestore | Alto | Média |
| 6 | Implementar captura de assinatura (ao menos desenhada) e vínculo a aprovações | Alto | Média |
| 7 | Implementar geração de relatório PDF (e certificado se escopo exigir) | Alto | Média |
| 8 | Decidir e implementar app mobile (React Native/Flutter) ou PWA + módulo offline | Alto | Média |
| 9 | Adicionar testes (unit + e2e) e pipeline CI/CD | Médio | Média |
| 10 | Documentar LGPD (bases legais, retenção, exclusão) e implementar pontos mínimos no app | Médio | Média |

---

## Resumo executivo

1. **Existe apenas a aplicação web (Sistema Singenta):** login, dashboard, CRUD de máquinas/processos e usuários, com Firebase (Auth + Firestore). **Não há app mobile (iOS/Android)** nem backend próprio com APIs REST/GraphQL.

2. **Grande parte do escopo de comissionamento/validação não está implementada:** sem projetos cadastráveis, sem etapas de comissionamento, sem aprovações multiusuário, sem evidências (fotos/docs), sem assinaturas, sem relatórios PDF/certificados, sem notificações e sem módulo offline.

3. **O que está entregue:** UI responsiva, autenticação e-mail/senha, dashboard com indicadores (métricas simuladas a partir de máquinas), gestão de máquinas/processos e clusters (backend), gestão de usuários com roles admin/user (sem restrição de acesso por perfil nas telas).

4. **Riscos imediatos:** sessão não restaurada ao recarregar (AuthContext não usa `observeAuthState`), RBAC não aplicado nas rotas, e possível inconsistência na criação de usuários (Firestore vs Firebase Auth).

5. **Para fechar a lacuna com o escopo:** é necessário implementar (ou documentar como "fora do escopo atual") app mobile, fluxo de comissionamento com etapas e aprovações, evidências e assinaturas, relatórios PDF, notificações, offline/sync, RBAC efetivo, LGPD e testes/CI/CD; e fornecer documentação (requisitos, wireframes, manuais) e detalhes de sandbox/segurança se existirem fora do repositório.
