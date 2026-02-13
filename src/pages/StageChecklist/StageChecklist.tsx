import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ChecklistExecutionService } from "../../services/checklistExecutionService";
import { ChecklistTemplateService } from "../../services/checklistTemplateService";
import { StageService } from "../../services/stageService";
import type { ChecklistExecution } from "../../types/checklistExecutions";
import type { ChecklistTemplate } from "../../types/checklistTemplates";
import type { Stage } from "../../types/stages";
import { useAuth } from "../../hooks/useAuth";
import { paths } from "../../routes/paths";
import { FiArrowLeft, FiPlus, FiFileText } from "react-icons/fi";
import "./StageChecklist.css";

const STATUS_LABEL: Record<ChecklistExecution["status"], string> = {
  draft: "Rascunho",
  submitted: "Enviado",
  approved: "Aprovado",
  rejected: "Reprovado",
};

export const StageChecklistPage: React.FC = () => {
  const { id: projectId, stageId } = useParams<{ id: string; stageId: string }>();
  const { user } = useAuth();
  const [executions, setExecutions] = useState<ChecklistExecution[]>([]);
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [stage, setStage] = useState<Stage | null>(null);
  const [loading, setLoading] = useState(true);
  const [createModal, setCreateModal] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  const load = () => {
    if (!stageId || !projectId) return;
    setLoading(true);
    Promise.all([
      ChecklistExecutionService.listByStage(stageId),
      ChecklistTemplateService.list(),
      StageService.getById(stageId),
    ])
      .then(([e, t, s]) => {
        setExecutions(e);
        setTemplates(t);
        setStage(s ?? null);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [stageId, projectId]);

  const handleCreate = async () => {
    if (!selectedTemplateId || !projectId || !stageId || !user) return;
    const template = await ChecklistTemplateService.getById(selectedTemplateId);
    const exec = await ChecklistExecutionService.create({
      templateId: selectedTemplateId,
      templateVersion: template?.version,
      projectId,
      stageId,
      createdBy: user.uid,
    });
    setCreateModal(false);
    setSelectedTemplateId("");
    window.location.href = paths.projectStageChecklist(projectId, stageId)(exec.id);
  };

  if (loading || !projectId || !stageId) {
    return (
      <div className="stage-checklist-page">
        <div className="loading-container"><div className="loading-spinner" /><p>Carregando...</p></div>
      </div>
    );
  }

  return (
    <div className="stage-checklist-page">
      <div className="page-header">
        <Link to={paths.projectStages(projectId)} className="back-link">
          <FiArrowLeft /> Etapas
        </Link>
        <h1>Checklists {stage ? `— ${stage.name}` : ""}</h1>
      </div>

      <div className="content-card">
        <div className="list-header">
          <h2>Execuções</h2>
          <button type="button" className="btn-primary" onClick={() => setCreateModal(true)}>
            <FiPlus /> Novo checklist
          </button>
        </div>

        {executions.length === 0 ? (
          <div className="empty-state">
            <FiFileText className="empty-icon" />
            <p>Nenhum checklist nesta etapa. Crie um escolhendo um template.</p>
            <button type="button" className="btn-primary" onClick={() => setCreateModal(true)}>
              <FiPlus /> Novo checklist
            </button>
          </div>
        ) : (
          <ul className="execution-list">
            {executions.map((e) => (
              <li key={e.id} className="execution-item">
                <Link
                  to={paths.projectStageChecklist(projectId, stageId)(e.id)}
                  className="exec-link"
                >
                  <FiFileText />
                  <span>Checklist — {new Date(e.createdAt).toLocaleString("pt-BR")}</span>
                </Link>
                <span className={`status-badge status-${e.status}`}>
                  {STATUS_LABEL[e.status]}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {createModal && (
        <div className="modal-overlay" onClick={() => setCreateModal(false)}>
          <div className="modal-container" onClick={(ev) => ev.stopPropagation()}>
            <div className="modal-header">
              <h2>Novo checklist</h2>
              <button type="button" className="modal-close" onClick={() => setCreateModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-form">
              <div className="form-group">
                <label className="form-label">Template</label>
                <select
                  className="form-select"
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                >
                  <option value="">Selecione...</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setCreateModal(false)}>
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleCreate}
                  disabled={!selectedTemplateId}
                >
                  Criar e abrir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
