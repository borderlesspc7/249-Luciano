# Relatório de Desenvolvimento — Sistema de Comissionamento

**Projeto:** 249-Luciano  
**Escopo:** Sprint 0, Sprint 1, Sprint 2 e evolução do builder de checklists  
**Data:** Fevereiro 2026  

Este documento descreve, em linguagem acessível, todas as modificações realizadas no sistema, o contexto de cada mudança e os benefícios entregues.

---

## 1. Visão geral do que foi entregue

Foi implementado um fluxo completo de **comissionamento**: desde autenticação e controle de acesso (Sprint 0), passando pela modelagem de **projetos, equipamentos, componentes e etapas** (Sprint 1), até **checklists configuráveis e execuções com histórico** (Sprint 2), além da evolução do **builder de templates** com identificadores estáveis, opções de seleção e versionamento. Todas as alterações foram commitadas em um único commit com título e descrição detalhada; o push ao repositório remoto pode exigir integração prévia com as alterações existentes no servidor.

---

## 2. Autenticação e controle de acesso (Sprint 0)

**O que foi feito:** O sistema passou a considerar o conceito de **perfil de usuário** (admin e user) e a proteger rotas conforme esse perfil.

**Por quê:** É necessário que apenas administradores acessem certas telas (por exemplo, gestão de usuários e templates de checklist) e que o restante dos usuários tenha acesso apenas às funcionalidades operacionais.

**Benefício:** Segurança e organização do uso do sistema de acordo com o papel de cada pessoa.

---

## 3. Ajustes no AuthContext e no authService

**O que foi feito:** O contexto de autenticação e o serviço de autenticação foram ajustados para carregar e expor a **role** do usuário (admin/user) a partir do documento do usuário no Firestore (`users/{uid}`).

**Por quê:** As rotas protegidas e a interface precisam saber, em tempo real, se o usuário logado é admin ou não, sem depender apenas de dados locais.

**Benefício:** Controle de acesso consistente e baseado em dados do backend.

---

## 4. Rotas protegidas por perfil (ProtectedRoutes)

**O que foi feito:** Foi implementado o suporte ao parâmetro `requiredRole="admin"` nas rotas. Quando uma rota exige perfil admin, usuários com perfil comum são impedidos de acessá-la.

**Por quê:** Garantir que apenas administradores acessem áreas sensíveis (usuários, templates de checklist), mesmo que tentem acessar a URL diretamente.

**Benefício:** Proteção efetiva das áreas administrativas.

---

## 5. CRUD de usuários e userService

**O que foi feito:** A tela de usuários (Users) foi refatorada para listar, criar, editar e excluir usuários usando o Firestore. O `userService` passou a trabalhar com a coleção `users` e o documento por `uid`, alinhado ao RBAC.

**Por quê:** Centralizar a gestão de usuários em dados reais no Firestore e manter consistência com o modelo de segurança (cada usuário em `users/{uid}`).

**Benefício:** Gestão de usuários confiável e alinhada às regras do banco.

---

## 6. Restrição da tela de usuários a administradores

**O que foi feito:** A rota da tela de usuários foi configurada com `requiredRole="admin"`. O item correspondente no menu lateral (sidebar) só é exibido para usuários com perfil admin.

**Por quê:** Evitar que usuários comuns vejam ou acessem a lista e as ações de gestão de usuários.

**Benefício:** Interface e segurança alinhadas ao perfil de cada usuário.

---

## 7. Sistema de convites (inviteService, AcceptInvite, InviteModal)

**O que foi feito:** Foi criado um fluxo completo de convite por link: geração de token de convite, envio do link (por exemplo por e-mail), página de aceite de convite (AcceptInvite) e modal de convites na gestão de usuários (InviteModal). O `inviteService` gerencia a coleção de convites no Firestore.

**Por quê:** Permitir que administradores convidem novos usuários sem precisar criar a senha manualmente; o convidado define a própria senha ao aceitar o link.

**Benefício:** Onboarding mais seguro e auditável.

---

## 8. Tipos de usuário e documento no Firestore

**O que foi feito:** Os tipos em `users.ts` foram alinhados ao que é armazenado no Firestore (incluindo o campo de role). O documento em `users/{uid}` é a fonte da verdade para perfil e dados do usuário.

**Por quê:** Manter tipagem e dados consistentes entre frontend e Firestore e evitar divergências que quebrem o RBAC.

**Benefício:** Código mais seguro e previsível.

---

## 9. Modelagem do domínio: projetos, equipamentos, componentes e etapas (Sprint 1)

**O que foi feito:** Foram definidos os tipos e as coleções no Firestore para **projects**, **assets** (equipamentos), **components** (componentes) e **stages** (etapas). Cada entidade possui campos obrigatórios, `createdAt`/`updatedAt` e referências (por exemplo `projectId` em assets e stages, `assetId` em components).

**Por quê:** Ter um modelo de dados claro e estável para comissionamento, permitindo listagens e filtros por projeto e equipamento.

**Benefício:** Base sólida para todas as telas e relatórios de comissionamento.

---

## 10. Serviços de domínio (projectService, assetService, componentService, stageService)

**O que foi feito:** Foram implementados serviços com operações de criação, atualização, exclusão, busca por ID e listagem (incluindo listagens por projeto ou por equipamento, conforme a entidade). O `stageService` inclui ainda a reordenação de etapas por projeto.

**Por quê:** Centralizar a lógica de acesso ao Firestore e garantir que todas as telas usem a mesma API e as mesmas regras de negócio.

**Benefício:** Manutenção mais simples e comportamento consistente em todo o sistema.

---

## 11. Dashboard com dados reais e atualização em tempo real

**O que foi feito:** O dashboard passou a usar apenas dados reais: lista de projetos, total de equipamentos (assets) e execuções de checklist. Foi implementada a inscrição em tempo real (subscribe/onSnapshot) na lista de projetos, com recálculo das métricas a partir dos dados atuais.

**Por quê:** Eliminar dados simulados e permitir que o usuário veja números e atividades atualizados assim que algo muda no Firestore.

**Benefício:** Dashboard confiável e em tempo real para acompanhamento do comissionamento.

---

## 12. Telas de projetos, detalhe do projeto, equipamentos e componentes

**O que foi feito:** Foram criadas as telas de listagem de projetos (com paginação, criar/editar/excluir; exclusão apenas para admin), detalhe do projeto com abas **Equipamentos** e **Etapas**, detalhe do equipamento com lista de componentes, e modais para criar/editar projetos, equipamentos, etapas e componentes.

**Por quê:** Permitir que o usuário navegue pela estrutura projeto → equipamento → componente e configure etapas por projeto, de forma intuitiva.

**Benefício:** Fluxo completo de configuração e visualização da estrutura de comissionamento.

---

## 13. Etapas e checklists por etapa

**O que foi feito:** Cada projeto possui etapas (por exemplo visual, funcional, performance) com ordem configurável. Para cada etapa existe uma área de checklists (StageChecklist), onde o usuário pode ver as execuções e criar novas a partir de um template.

**Por quê:** Organizar o comissionamento por etapas e permitir múltiplos checklists por etapa, cada um baseado em um template.

**Benefício:** Processo de comissionamento organizado e rastreável por etapa.

---

## 14. Rotas e navegação (paths, AppRoutes, Sidebar)

**O que foi feito:** Foram definidas rotas para `/projects`, `/projects/:id`, `/projects/:id/assets/:assetId`, `/projects/:id/stages/:stageId/checklist` e `/projects/:id/stages/:stageId/checklist/:executionId`, além de `/admin/checklist-templates`. O arquivo de paths foi atualizado (incluindo `projectDetail(id)`) e o menu lateral passou a exibir **Projetos** e **Templates de checklist** (este último apenas para admin).

**Por quê:** Garantir que cada tela tenha uma URL clara e que o usuário chegue nela pelo menu ou por links internos, sem rotas inexistentes.

**Benefício:** Navegação previsível e sem telas em branco por rota errada.

---

## 15. Correção do link “Abrir projeto” (projectDetail)

**O que foi feito:** Os links que levavam ao “detalhe do projeto” estavam apontando para `/projects/:id/assets`, rota que não existia, causando tela em branco e erro “No routes matched location”. Foi criado o helper `projectDetail(id)` e todos os links de “abrir/editar projeto” passaram a usar `/projects/:id`.

**Por quê:** O detalhe do projeto (com abas Equipamentos e Etapas) é uma única tela em `/projects/:id`; não há tela separada só para “assets” sem um assetId.

**Benefício:** Ao clicar em um projeto, o usuário passa a ver corretamente a tela de detalhe com abas.

---

## 16. Modelagem de templates e execuções de checklist (Sprint 2)

**O que foi feito:** Foram definidos os tipos e as coleções **checklistTemplates** e **checklistExecutions**. O template contém nome, descrição e lista de campos (id, label, tipo, obrigatório, opções para select). A execução contém referências ao template, projeto, etapa, status (rascunho, enviado, aprovado, reprovado), respostas e trilha de auditoria (auditTrail).

**Por quê:** Separar a “receita” do checklist (template) da “preenchimento” (execução), permitindo reutilizar o mesmo template em várias execuções e auditar alterações.

**Benefício:** Flexibilidade e rastreabilidade dos checklists.

---

## 17. Regras de edição de execução (apenas rascunho)

**O que foi feito:** No serviço de execução e nas **regras do Firestore**, foi garantido que uma execução só pode ser atualizada (incluindo alteração de respostas) enquanto o status for **draft**. Após envio, as alterações são bloqueadas no backend e na interface.

**Por quê:** Evitar que checklists já enviados ou aprovados sejam alterados depois, mantendo a integridade do histórico.

**Benefício:** Confiança no estado “enviado” ou “aprovado” do checklist.

---

## 18. Builder de templates e tela de preenchimento de checklist

**O que foi feito:** Foi implementada a tela em `/admin/checklist-templates` para criar e editar templates (campos texto, número, sim/não e seleção). Na tela de execução, o usuário preenche os campos conforme o template, pode salvar rascunho, enviar, exportar JSON e visualizar o histórico (auditTrail); os campos ficam bloqueados quando o status não é rascunho.

**Por quê:** Permitir que o administrador modele os checklists e que qualquer usuário autorizado preencha e envie as execuções, com rastreabilidade.

**Benefício:** Checklists totalmente configuráveis e uso simples na operação.

---

## 19. fieldId estável no builder

**O que foi feito:** Cada campo do template passou a ter um **id** estável (fieldId), gerado automaticamente a partir do rótulo em formato slug (ex.: “Tensão nominal” → `tensao_nominal`). Em caso de duplicata, é adicionado sufixo numérico (`_2`, `_3`). O id não é alterado após o template ser salvo e é exibido em badge no builder.

**Por quê:** As respostas da execução são armazenadas por fieldId; se o id mudasse a cada edição, execuções antigas deixariam de bater com os campos do template e os dados ficariam inconsistentes.

**Benefício:** Execuções antigas continuam válidas mesmo após alterações no template (rótulos, opções, etc.).

---

## 20. Opções de seleção (select) no template

**O que foi feito:** O tipo “Seleção” passou a usar a estrutura **options: { value, label }[]**: `value` é um slug único (usado ao salvar a resposta) e `label` é o texto exibido. No builder, o administrador pode adicionar, editar, remover e reordenar opções. Foi garantido que um campo do tipo seleção exija pelo menos uma opção para poder salvar o template.

**Por quê:** Separar o valor armazenado (value) do texto mostrado (label) permite mudar o rótulo sem quebrar respostas já salvas e mantém valores padronizados (slugs).

**Benefício:** Selects profissionais, consistentes e seguros para relatórios e integrações.

---

## 21. Versionamento de templates e templateVersion na execução

**O que foi feito:** O documento do template no Firestore passou a ter um campo **version** (número inteiro, iniciando em 1), incrementado a cada atualização do template. Ao criar uma execução, o sistema grava **templateVersion** com a versão atual do template, mantida na execução para auditoria. Execuções antigas continuam exibindo e exportando seus dados normalmente, independentemente de alterações futuras no template.

**Por quê:** Saber qual versão do template foi usada em cada execução ajuda em auditorias e suporte; não é necessário criar cópias do template (ex.: template_v2) para cada mudança.

**Benefício:** Histórico claro e execuções antigas preservadas.

---

## 22. Utilitários e validações do builder

**O que foi feito:** Foi criado o módulo `checklistTemplateUtils` com funções para gerar slug a partir do label, gerar fieldId único e valor único para opções de select, além da normalização de opções no formato antigo (lista de strings) para o novo formato (array de { value, label }). No builder, foram implementadas validações: rótulo obrigatório em todo campo, pelo menos uma opção em campos do tipo seleção e impedimento de salvar com IDs de campo duplicados.

**Por quê:** Garantir dados sempre no formato esperado pelo restante do sistema e evitar templates inválidos (sem rótulo ou select sem opção).

**Benefício:** Builder robusto e dados consistentes no Firestore.

---

## 23. Atualização das regras do Firestore (firestore.rules)

**O que foi feito:** As regras de segurança do Firestore foram atualizadas para incluir as novas coleções: **projects**, **assets**, **components** e **stages** com leitura e escrita permitidas para usuários autenticados; **checklistTemplates** com leitura e escrita para autenticados; **checklistExecutions** com leitura, criação e exclusão para autenticados e **atualização permitida apenas quando o documento está com status `draft`**, impedindo alteração de checklists já enviados ou aprovados.

**Por quê:** Sem regras explícitas, o Firestore poderia negar acesso ou permitir alterações indevidas. A restrição de update por status protege o ciclo de vida do checklist no próprio banco.

**Benefício:** Segurança alinhada ao modelo de negócio e proteção contra edição indevida de execuções.

---

## 24. Criação de índices compostos no Firestore (firestore.indexes.json)

**O que foi feito:** Foi criado o arquivo **firestore.indexes.json** com a definição dos **índices compostos** necessários para as consultas do sistema: (1) **assets** por `projectId` e `createdAt` (ordem descendente); (2) **stages** por `projectId` e `order` (ordem ascendente); (3) **components** por `assetId` e `createdAt` (ordem descendente); (4) **checklistExecutions** por `stageId` e `createdAt` (ordem descendente); (5) **checklistExecutions** por `projectId` e `createdAt` (ordem descendente). Esses índices são necessários para listagens por projeto ou etapa e para o cálculo das métricas do dashboard.

**Por quê:** O Firestore exige índice composto quando a consulta combina filtro (where) e ordenação (orderBy) em campos diferentes. Sem esses índices, as consultas retornam erro e o dashboard e as listagens deixam de funcionar.

**Benefício:** Dashboard e todas as listagens (equipamentos, etapas, componentes, checklists) funcionando corretamente. Os índices podem ser implantados via CLI (`firebase deploy --only firestore:indexes`) ou criados manualmente no Console do Firebase conforme o guia **FIREBASE_INDICES_MANUAL.md**.

---

## 25. Documentação de deploy e índices manuais

**O que foi feito:** Foram criados os documentos **FIREBASE_DEPLOY.md** (comandos para publicar regras e índices no Firebase) e **FIREBASE_INDICES_MANUAL.md** (passo a passo para criar cada índice composto manualmente no Console do Firebase, para quem não utilizar a CLI).

**Por quê:** Garantir que a equipe ou o cliente saibam como atualizar regras e criar índices após o deploy, evitando erros de “query requires an index” e mantendo a segurança atualizada.

**Benefício:** Operação e manutenção do Firebase documentadas e reproduzíveis.

---

## 26. Documentação de entregáveis das sprints e do builder

**O que foi feito:** Foram criados os arquivos **SPRINT0_PLAN.md**, **SPRINT0_ENTREGAVEIS.md**, **SPRINT1_2_ENTREGAVEIS.md** e **BUILDER_CHECKLIST_ENTREGAVEIS.md**, contendo decisões técnicas, listas de arquivos alterados, orientações para patches e checklists de validação manual. O **PANORAMA_PROJETO_ESCOPO.md** foi mantido/atualizado para contexto do projeto.

**Por quê:** Deixar registrado o que foi planejado, o que foi entregue e como validar cada parte, facilitando revisão e onboarding.

**Benefício:** Rastreabilidade e validação organizadas para cliente e equipe.

---

## 27. Resumo para o cliente

Todas as alterações descritas acima foram commitadas em um único commit, com título e descrição detalhada em português. O **push** para o repositório remoto pode exigir que você integre antes as alterações que já existem no servidor (por exemplo, com `git pull --rebase` e resolução de conflitos, se houver). O sistema passa a contar com:

- Controle de acesso por perfil (admin/user) e gestão de usuários e convites.  
- Projetos, equipamentos, componentes e etapas modelados e utilizados no dashboard em tempo real.  
- Checklists configuráveis por template, com preenchimento, envio, histórico e bloqueio de edição após envio.  
- Builder de templates com fieldId estável, opções de seleção completas e versionamento.  
- **Regras do Firestore** atualizadas para as novas coleções e para impedir edição de execuções fora do status rascunho.  
- **Índices compostos** definidos para que o dashboard e todas as listagens funcionem corretamente, com opção de deploy via CLI ou criação manual no Console.

Se desejar, podemos agendar uma validação em conjunto usando os checklists dos documentos de entregáveis ou ajustar algum ponto específico do relatório.
