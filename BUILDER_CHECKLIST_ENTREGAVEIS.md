# Builder de Checklist — Decisões e Entregáveis

## 1) Decisões arquiteturais (máx 15 linhas)

- **fieldId:** Gerado por slug do label (`labelToSlug`) e garantia de unicidade com sufixo `_2`, `_3` se necessário. Definido apenas na criação do campo; não é alterado ao editar o label (estável após salvar).
- **Opções do select:** Estrutura `{ value: string, label: string }[]`. `value` = slug (único no campo); `label` editável. Migração: templates antigos com `options: string[]` são normalizados em leitura para `SelectOption[]` em `checklistTemplateUtils` e no service.
- **Versionamento:** Campo `version` no documento do template; inicia em 1; incrementado a cada `update` no mesmo documento (sem subcoleção nem `templateId_v2`). Execuções guardam `templateVersion` no create para auditoria; execuções antigas continuam válidas (respostas por fieldId, que não muda).
- **Validações no builder:** Rótulo obrigatório; select exige ≥ 1 opção; IDs duplicados impedem salvar (geração já evita duplicata; checagem explícita na validação).
- **Firestore Rules:** Sem alteração; mesmas coleções e regras.

---

## 2) Lista de arquivos alterados

**Criados:**  
`src/utils/checklistTemplateUtils.ts`

**Alterados:**  
`src/types/checklistTemplates.ts` (SelectOption, options como SelectOption[], version)  
`src/types/checklistExecutions.ts` (templateVersion)  
`src/services/checklistTemplateService.ts` (version, normalize fields/options, update retorna template)  
`src/services/checklistExecutionService.ts` (templateVersion no create e toExecution)  
`src/pages/ChecklistTemplates/ChecklistTemplates.tsx` (fieldId estável, editor de opções, validações)  
`src/pages/ChecklistTemplates/ChecklistTemplates.css` (field-block, options editor, validation errors)  
`src/pages/ChecklistExecution/ChecklistExecution.tsx` (select options value/label, getDefaultValue, templateVersion no export)  
`src/pages/StageChecklist/StageChecklist.tsx` (passa templateVersion ao criar execução)

---

## 3) Patches

Gerar com:
```bash
git add -A && git diff --cached -- . ':!BUILDER_CHECKLIST_ENTREGAVEIS.md' ':!credenciais*' ':!.env' > builder_checklist.patch
```

---

## 4) Firestore Rules

Sem alteração. Regras atuais de `checklistTemplates` e `checklistExecutions` continuam válidas.

---

## 5) Checklist de validação manual

1. **Template com select:** Admin → Templates de checklist → Novo template. Nome; adicionar campo; tipo "Seleção". Verificar badge com fieldId (ex.: `novo_campo`). Adicionar opções: "Conforme", "Não conforme". Ver valor (slug) ao lado. Reordenar opções (subir/descer). Remover uma opção (deve manter ≥ 1). Salvar.
2. **fieldId estável:** Editar o template; alterar rótulo do campo; salvar. Reabrir: fieldId inalterado.
3. **Validações:** Template com campo select e zero opções → Salvar deve exibir erro "pelo menos uma opção". Campo sem rótulo → erro de rótulo obrigatório.
4. **Criar execução:** Em um projeto/etapa, Novo checklist → escolher template com select → criar. Abrir execução; preencher campo select (valores do template); salvar rascunho; enviar.
5. **Execução intacta após edição do template:** Criar execução com template T; preencher e enviar. Depois editar T (adicionar campo ou opção, alterar rótulos). Abrir a execução já enviada: dados e status inalterados; campos bloqueados.
6. **Export JSON:** Na execução, Exportar JSON. Verificar presença de `templateVersion`, `responses` com fieldIds, `auditTrail`.
7. **Templates antigos (legado):** Se existir template com `options: ["A", "B"]` (string[]), abrir no builder e na execução: deve aparecer normalizado (value = slug, label = string). Salvar não quebra.
8. **Versão no template:** Após criar template (v1), editar e salvar: card na lista deve mostrar "v2". Nova execução deve gravar `templateVersion: 2`.
