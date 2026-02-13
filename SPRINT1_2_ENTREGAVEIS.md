# Sprint 1 + Sprint 2 — Entregáveis

## 1) Decisões técnicas (máx. 20 linhas)

- **Coleções:** Todas em raiz (projects, assets, components, stages, checklistTemplates, checklistExecutions). Sem subcoleções para facilitar queries e regras.
- **Relações:** projectId em assets e stages; assetId em components; templateId, projectId, stageId em checklistExecutions. Timestamps createdAt/updatedAt em todas.
- **auditTrail:** Array dentro do documento checklistExecutions; cada item: userId, action, timestamp, previousStatus?, changedFields?.
- **Realtime:** Dashboard usa subscribe (onSnapshot) em projects; métricas recalculadas com listagens de assets e checklistExecutions.
- **Rotas:** /projects, /projects/:id (detalhe com abas Equipamentos/Etapas), /projects/:id/assets/:assetId, /projects/:id/stages/:stageId/checklist e .../checklist/:executionId, /admin/checklist-templates (admin).
- **Estrutura de pastas:** types/, services/, pages/ (Projects, ProjectDetail, AssetDetail, StageChecklist, ChecklistExecution, ChecklistTemplates). Firestore rules e indexes em firebase/.

---

## 2) Lista de arquivos criados/alterados

**Criados:**  
src/types/projects.ts, assets.ts, components.ts, stages.ts, checklistTemplates.ts, checklistExecutions.ts  
src/services/projectService.ts, assetService.ts, componentService.ts, stageService.ts, checklistTemplateService.ts, checklistExecutionService.ts  
src/pages/Projects/Projects.tsx, ProjectModal.tsx, Projects.css  
src/pages/ProjectDetail/ProjectDetail.tsx, AssetModal.tsx, StageModal.tsx, ProjectDetail.css  
src/pages/AssetDetail/AssetDetail.tsx, ComponentModal.tsx, AssetDetail.css  
src/pages/StageChecklist/StageChecklist.tsx, StageChecklist.css  
src/pages/ChecklistExecution/ChecklistExecution.tsx, ChecklistExecution.css  
src/pages/ChecklistTemplates/ChecklistTemplates.tsx, ChecklistTemplates.css  
firebase/firestore.indexes.json  

**Alterados:**  
src/routes/paths.ts, AppRoutes.tsx  
src/components/Sidebar/Sidebar.tsx  
src/services/dashboardService.ts  
firebase/firestore.rules  

---

## 3) Patches (unified diff)

Gerar com:
```bash
git diff HEAD -- . ':!SPRINT1_2_ENTREGAVEIS.md' ':!credenciais*' ':!.env' > sprint1_2.patch
```
(ou incluir este arquivo no patch, conforme preferência do repositório.)

---

## 4) Firestore Rules (trecho adicionado)

Incluído em `firebase/firestore.rules`:

- projects, assets, components, stages: allow read, write se isAuth().
- checklistTemplates: allow read, write se isAuth().
- checklistExecutions: allow read, create, delete se isAuth(); allow update apenas se isAuth() e resource.data.status == 'draft'.

---

## 5) Checklist de validação manual (10–15 passos)

1. Login com usuário existente; acessar Dashboard.
2. Dashboard: conferir que totais vêm de projetos reais (sem dados simulados).
3. Menu: clicar em "Projetos"; listar projetos; criar um novo (nome, descrição, status).
4. Editar um projeto; excluir um (apenas como admin).
5. Abrir um projeto; aba Equipamentos: criar equipamento; editar; excluir.
6. Clicar em um equipamento: na tela de detalhe, criar/editar/excluir componentes.
7. No projeto, aba Etapas: criar etapas (visual, funcional, performance); editar nome/tipo/ordem; excluir.
8. Clicar em "Checklist" de uma etapa: lista de execuções; "Novo checklist" → escolher template → criar execução e ir para preenchimento.
9. Preencher checklist (rascunho): alterar campos; "Salvar rascunho"; conferir que dados persistem.
10. "Enviar" checklist; conferir badge "Enviado" e que inputs ficam desabilitados.
11. Tentar editar execução já enviada (via UI e, se possível, via regra): deve estar bloqueado.
12. Exportar JSON: botão "Exportar JSON" deve baixar o JSON da execução.
13. Admin: acessar "Templates de checklist"; criar template com campos (text, number, boolean, select); reordenar; salvar.
14. Conferir auditTrail na execução (histórico com userId, action, timestamp).
15. Verificar regras: deploy das Firestore rules e testar acesso negado a update de checklist com status != draft.
