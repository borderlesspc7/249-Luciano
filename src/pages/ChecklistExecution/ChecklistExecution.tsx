import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ChecklistExecutionService } from "../../services/checklistExecutionService";
import { ChecklistTemplateService } from "../../services/checklistTemplateService";
import type { ChecklistExecution } from "../../types/checklistExecutions";
import type { ChecklistTemplate } from "../../types/checklistTemplates";
import type { ChecklistTemplateField } from "../../types/checklistTemplates";
import { useAuth } from "../../hooks/useAuth";
import { paths } from "../../routes/paths";
import { FiArrowLeft, FiSave, FiSend, FiDownload } from "react-icons/fi";
import "./ChecklistExecution.css";

const STATUS_LABEL: Record<ChecklistExecution["status"], string> = {
  draft: "Rascunho",
  submitted: "Enviado",
  approved: "Aprovado",
  rejected: "Reprovado",
};

function getDefaultValue(field: ChecklistTemplateField): string | number | boolean {
  switch (field.type) {
    case "number":
      return 0;
    case "boolean":
      return false;
    case "select": {
      const opts = field.options;
      if (!opts?.length) return "";
      const first = opts[0];
      return typeof first === "string" ? first : first.value;
    }
    default:
      return "";
  }
}

export const ChecklistExecutionPage: React.FC = () => {
  const { id: projectId, stageId, executionId } = useParams<{ id: string; stageId: string; executionId: string }>();
  const { user } = useAuth();
  const [execution, setExecution] = useState<ChecklistExecution | null>(null);
  const [template, setTemplate] = useState<ChecklistTemplate | null>(null);
  const [responses, setResponses] = useState<Record<string, string | number | boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDraft = execution?.status === "draft";
  const canEdit = isDraft && !!user;

  const load = () => {
    if (!executionId) return;
    setLoading(true);
    ChecklistExecutionService.getById(executionId)
      .then(async (exec) => {
        if (!exec) return;
        setExecution(exec);
        const t = await ChecklistTemplateService.getById(exec.templateId);
        setTemplate(t ?? null);
        const initial: Record<string, string | number | boolean> = {};
        t?.fields.forEach((f) => {
          if (exec.responses[f.id] !== undefined) {
            initial[f.id] = exec.responses[f.id];
          } else {
            initial[f.id] = getDefaultValue(f);
          }
        });
        setResponses(initial);
      })
      .catch(() => setError("Checklist não encontrado."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [executionId]);

  const handleFieldChange = (fieldId: string, value: string | number | boolean) => {
    if (!canEdit) return;
    setResponses((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleSaveDraft = async () => {
    if (!executionId || !user || !canEdit) return;
    setSaving(true);
    setError(null);
    try {
      await ChecklistExecutionService.update(
        executionId,
        { responses: { ...responses } },
        user.uid,
        { action: "draft_saved", changedFields: Object.keys(responses) }
      );
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!executionId || !user || !canEdit) return;
    setSaving(true);
    setError(null);
    try {
      await ChecklistExecutionService.update(
        executionId,
        { responses: { ...responses }, status: "submitted" },
        user.uid,
        { action: "submitted", previousStatus: "draft" }
      );
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao enviar.");
    } finally {
      setSaving(false);
    }
  };

  const handleExportJson = () => {
    if (!execution) return;
    const payload = {
      id: execution.id,
      templateId: execution.templateId,
      templateVersion: execution.templateVersion,
      projectId: execution.projectId,
      stageId: execution.stageId,
      status: execution.status,
      responses: execution.responses,
      auditTrail: execution.auditTrail,
      createdAt: execution.createdAt,
      updatedAt: execution.updatedAt,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `checklist-${execution.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading || !execution || !projectId || !stageId) {
    return (
      <div className="checklist-execution-page">
        <div className="loading-container">
          <div className="loading-spinner" />
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  if (error && !template) {
    return (
      <div className="checklist-execution-page">
        <div className="error-state">
          <p>{error}</p>
          <Link to={paths.projectStageChecklist(projectId, stageId)()}>Voltar</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="checklist-execution-page">
      <div className="page-header">
        <Link to={paths.projectStageChecklist(projectId, stageId)()} className="back-link">
          <FiArrowLeft /> Checklists
        </Link>
        <div className="header-row">
          <h1>Checklist</h1>
          <span className={`status-badge status-${execution.status}`}>
            {STATUS_LABEL[execution.status]}
          </span>
        </div>
        <div className="header-actions">
          <button type="button" className="btn-secondary" onClick={handleExportJson}>
            <FiDownload /> Exportar JSON
          </button>
          {canEdit && (
            <>
              <button type="button" className="btn-secondary" onClick={handleSaveDraft} disabled={saving}>
                <FiSave /> {saving ? "Salvando..." : "Salvar rascunho"}
              </button>
              <button type="button" className="btn-primary" onClick={handleSubmit} disabled={saving}>
                <FiSend /> Enviar
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="form-card">
        {template?.fields.map((field) => (
          <div key={field.id} className="form-group">
            <label className="form-label">
              {field.label}
              {field.required && <span className="required"> *</span>}
            </label>
            {field.type === "text" && (
              <input
                type="text"
                className="form-input"
                value={String(responses[field.id] ?? "")}
                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                disabled={!canEdit}
              />
            )}
            {field.type === "number" && (
              <input
                type="number"
                className="form-input"
                value={Number(responses[field.id] ?? 0)}
                onChange={(e) => handleFieldChange(field.id, Number(e.target.value))}
                disabled={!canEdit}
              />
            )}
            {field.type === "boolean" && (
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={Boolean(responses[field.id])}
                  onChange={(e) => handleFieldChange(field.id, e.target.checked)}
                  disabled={!canEdit}
                />
                {field.label}
              </label>
            )}
            {field.type === "select" && (
              <select
                className="form-select"
                value={String(responses[field.id] ?? "")}
                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                disabled={!canEdit}
              >
                {(field.options ?? []).map((opt) => {
                  const value = typeof opt === "string" ? opt : opt.value;
                  const label = typeof opt === "string" ? opt : opt.label;
                  return (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  );
                })}
              </select>
            )}
          </div>
        ))}
      </div>

      {execution.auditTrail.length > 0 && (
        <div className="audit-section">
          <h3>Histórico</h3>
          <ul className="audit-list">
            {execution.auditTrail.map((entry, i) => (
              <li key={i} className="audit-item">
                <span className="audit-action">{entry.action}</span>
                <span className="audit-time">
                  {entry.timestamp instanceof Date
                    ? entry.timestamp.toLocaleString("pt-BR")
                    : String(entry.timestamp)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="loading-container" style={{ display: "none" }} />
    </div>
  );
};
