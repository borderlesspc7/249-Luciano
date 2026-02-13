import React, { useState, useEffect } from "react";
import { ChecklistTemplateService } from "../../services/checklistTemplateService";
import type { ChecklistTemplate, ChecklistTemplateField, SelectOption } from "../../types/checklistTemplates";
import { generateUniqueFieldId, uniqueOptionValue } from "../../utils/checklistTemplateUtils";
import { useAuth } from "../../hooks/useAuth";
import { FiPlus, FiTrash2, FiSave, FiLoader, FiChevronUp, FiChevronDown } from "react-icons/fi";
import "./ChecklistTemplates.css";

const FIELD_TYPES: { value: ChecklistTemplateField["type"]; label: string }[] = [
  { value: "text", label: "Texto" },
  { value: "number", label: "Número" },
  { value: "boolean", label: "Sim/Não" },
  { value: "select", label: "Seleção" },
];

function deepCopyFields(fields: ChecklistTemplateField[]): ChecklistTemplateField[] {
  return fields.map((f) => ({
    ...f,
    options: f.options?.map((o) => ({ ...o })) ?? undefined,
  }));
}

export const ChecklistTemplatesPage: React.FC = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ChecklistTemplate | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState<ChecklistTemplateField[]>([]);
  const [saving, setSaving] = useState(false);
  const [createNew, setCreateNew] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const load = () => {
    setLoading(true);
    ChecklistTemplateService.list()
      .then(setTemplates)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openEdit = (t: ChecklistTemplate) => {
    setEditing(t);
    setCreateNew(false);
    setName(t.name);
    setDescription(t.description ?? "");
    setFields(deepCopyFields(t.fields));
    setValidationErrors([]);
  };

  const openCreate = () => {
    setEditing(null);
    setCreateNew(true);
    setName("");
    setDescription("");
    setFields([]);
    setValidationErrors([]);
  };

  const closeForm = () => {
    setEditing(null);
    setCreateNew(false);
    setValidationErrors([]);
  };

  const addField = () => {
    const existingIds = fields.map((f) => f.id);
    const newId = generateUniqueFieldId("Novo campo", existingIds);
    setFields((prev) => [
      ...prev,
      { id: newId, label: "Novo campo", type: "text", required: false },
    ]);
  };

  const removeField = (id: string) => {
    setFields((prev) => prev.filter((f) => f.id !== id));
  };

  const updateField = (id: string, updates: Partial<ChecklistTemplateField>) => {
    setFields((prev) =>
      prev.map((f) => {
        if (f.id !== id) return f;
        const next = { ...f, ...updates };
        if (updates.type === "select" && next.options === undefined) next.options = [];
        return next;
      })
    );
  };

  const moveField = (index: number, dir: "up" | "down") => {
    setFields((prev) => {
      const next = [...prev];
      const j = dir === "up" ? index - 1 : index + 1;
      if (j < 0 || j >= next.length) return prev;
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });
  };

  const addOption = (fieldId: string) => {
    setFields((prev) =>
      prev.map((f) => {
        if (f.id !== fieldId || f.type !== "select") return f;
        const opts = f.options ?? [];
        const existingValues = opts.map((o) => o.value);
        const newOpt: SelectOption = {
          value: uniqueOptionValue("Nova opção", existingValues),
          label: "Nova opção",
        };
        return { ...f, options: [...opts, newOpt] };
      })
    );
  };

  const updateOption = (fieldId: string, index: number, updates: Partial<SelectOption>) => {
    setFields((prev) =>
      prev.map((f) => {
        if (f.id !== fieldId || !f.options) return f;
        const opts = [...f.options];
        opts[index] = { ...opts[index], ...updates };
        if (updates.label !== undefined) {
          const others = opts.filter((_, i) => i !== index).map((o) => o.value);
          opts[index].value = uniqueOptionValue(updates.label.trim() || "opcao", others);
        }
        return { ...f, options: opts };
      })
    );
  };

  const removeOption = (fieldId: string, index: number) => {
    setFields((prev) =>
      prev.map((f) => {
        if (f.id !== fieldId || !f.options) return f;
        const opts = f.options.filter((_, i) => i !== index);
        return { ...f, options: opts };
      })
    );
  };

  const moveOption = (fieldId: string, index: number, dir: "up" | "down") => {
    setFields((prev) =>
      prev.map((f) => {
        if (f.id !== fieldId || !f.options) return f;
        const opts = [...f.options];
        const j = dir === "up" ? index - 1 : index + 1;
        if (j < 0 || j >= opts.length) return f;
        [opts[index], opts[j]] = [opts[j], opts[index]];
        return { ...f, options: opts };
      })
    );
  };

  const validate = (): boolean => {
    const errs: string[] = [];
    const ids = new Set<string>();
    fields.forEach((f, i) => {
      if (!f.label.trim()) errs.push(`Campo ${i + 1}: rótulo é obrigatório.`);
      if (ids.has(f.id)) errs.push(`Campo "${f.label}" tem ID duplicado.`);
      ids.add(f.id);
      if (f.type === "select") {
        const opts = f.options ?? [];
        if (opts.length === 0) errs.push(`Campo "${f.label}" (Seleção) precisa de pelo menos uma opção.`);
      }
    });
    setValidationErrors(errs);
    return errs.length === 0;
  };

  const handleSave = async () => {
    if (!user || !name.trim() || saving) return;
    if (!validate()) return;
    setSaving(true);
    setValidationErrors([]);
    try {
      if (editing) {
        await ChecklistTemplateService.update(editing.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          fields,
        });
      } else {
        await ChecklistTemplateService.create(
          { name: name.trim(), description: description.trim() || undefined, fields },
          user.uid
        );
      }
      load();
      closeForm();
    } catch (e) {
      setValidationErrors([e instanceof Error ? e.message : "Erro ao salvar."]);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="checklist-templates-page">
        <div className="loading-container"><div className="loading-spinner" /><p>Carregando...</p></div>
      </div>
    );
  }

  return (
    <div className="checklist-templates-page">
      <div className="page-header">
        <h1>Templates de checklist</h1>
        <button type="button" className="btn-primary" onClick={openCreate}>
          <FiPlus /> Novo template
        </button>
      </div>

      <div className="templates-list">
        {templates.length === 0 && !createNew && !editing ? (
          <div className="empty-state">
            <p>Nenhum template. Crie um para usar em checklists.</p>
            <button type="button" className="btn-primary" onClick={openCreate}>
              <FiPlus /> Novo template
            </button>
          </div>
        ) : (
          templates.map((t) => (
            <div key={t.id} className="template-card">
              <div className="template-info">
                <h3>{t.name}</h3>
                {t.description && <p>{t.description}</p>}
                <span className="field-count">v{t.version} · {t.fields.length} campo(s)</span>
              </div>
              <button type="button" className="btn-secondary" onClick={() => openEdit(t)}>
                Editar
              </button>
            </div>
          ))
        )}
      </div>

      {(createNew || editing) && (
        <div className="form-panel">
          <h2>{editing ? "Editar template" : "Novo template"}</h2>
          {validationErrors.length > 0 && (
            <div className="validation-errors">
              {validationErrors.map((msg, i) => (
                <div key={i} className="validation-error-item">{msg}</div>
              ))}
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Nome *</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do template"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Descrição</label>
            <input
              type="text"
              className="form-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Opcional"
            />
          </div>
          <div className="fields-section">
            <div className="fields-header">
              <h3>Campos</h3>
              <button type="button" className="btn-primary small" onClick={addField}>
                <FiPlus /> Adicionar campo
              </button>
            </div>
            {fields.map((field, index) => (
              <div key={field.id} className="field-block">
                <div className="field-row">
                  <span className="field-id-badge" title="ID estável (não altere)">{field.id}</span>
                  <input
                    type="text"
                    className="form-input"
                    value={field.label}
                    onChange={(e) => updateField(field.id, { label: e.target.value })}
                    placeholder="Rótulo"
                  />
                  <select
                    className="form-select small"
                    value={field.type}
                    onChange={(e) => updateField(field.id, { type: e.target.value as ChecklistTemplateField["type"] })}
                  >
                    {FIELD_TYPES.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <label className="checkbox-inline">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) => updateField(field.id, { required: e.target.checked })}
                    />
                    Obrigatório
                  </label>
                  <div className="field-actions">
                    <button type="button" className="btn-icon" onClick={() => moveField(index, "up")} disabled={index === 0} title="Subir">
                      <FiChevronUp />
                    </button>
                    <button type="button" className="btn-icon" onClick={() => moveField(index, "down")} disabled={index === fields.length - 1} title="Descer">
                      <FiChevronDown />
                    </button>
                    <button type="button" className="btn-icon danger" onClick={() => removeField(field.id)} title="Remover">
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
                {field.type === "select" && (
                  <div className="select-options-editor">
                    <div className="options-toolbar">
                      <span className="options-label">Opções (value = slug):</span>
                      <button type="button" className="btn-primary small" onClick={() => addOption(field.id)}>
                        <FiPlus /> Adicionar opção
                      </button>
                    </div>
                    {(field.options ?? []).map((opt, optIndex) => (
                      <div key={optIndex} className="option-row">
                        <input
                          type="text"
                          className="form-input small"
                          value={opt.label}
                          onChange={(e) => updateOption(field.id, optIndex, { label: e.target.value })}
                          placeholder="Rótulo"
                        />
                        <span className="option-value">{opt.value}</span>
                        <div className="field-actions">
                          <button type="button" className="btn-icon" onClick={() => moveOption(field.id, optIndex, "up")} disabled={optIndex === 0} title="Subir">
                            <FiChevronUp />
                          </button>
                          <button type="button" className="btn-icon" onClick={() => moveOption(field.id, optIndex, "down")} disabled={optIndex === (field.options!.length - 1)} title="Descer">
                            <FiChevronDown />
                          </button>
                          <button type="button" className="btn-icon danger" onClick={() => removeOption(field.id, optIndex)} disabled={(field.options ?? []).length <= 1} title="Remover">
                            <FiTrash2 />
                          </button>
                        </div>
                      </div>
                    ))}
                    {(field.options ?? []).length === 0 && (
                      <p className="options-hint">Adicione pelo menos uma opção para o campo de seleção.</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={closeForm} disabled={saving}>
              Cancelar
            </button>
            <button type="button" className="btn-primary" onClick={handleSave} disabled={saving || !name.trim()}>
              {saving ? <FiLoader className="spinner" /> : <FiSave />}
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
