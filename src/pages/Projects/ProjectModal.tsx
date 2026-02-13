import React, { useState, useEffect } from "react";
import type { Project, CreateProjectData, UpdateProjectData } from "../../types/projects";
import { FiX, FiSave, FiLoader } from "react-icons/fi";

interface ProjectModalProps {
  project?: Project | null;
  onSave: (data: CreateProjectData | UpdateProjectData) => void;
  onClose: () => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({ project, onSave, onClose }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<Project["status"]>("active");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description ?? "");
      setStatus(project.status);
    } else {
      setName("");
      setDescription("");
      setStatus("active");
    }
    setErrors({});
  }, [project]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Nome é obrigatório";
    else if (name.trim().length < 2) e.name = "Nome deve ter pelo menos 2 caracteres";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || submitting) return;
    setSubmitting(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim() || undefined,
        ...(project ? { status } : {}),
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(ev) => ev.stopPropagation()}>
        <div className="modal-header">
          <h2>{project ? "Editar projeto" : "Novo projeto"}</h2>
          <button type="button" className="modal-close" onClick={onClose} disabled={submitting}>
            <FiX />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Nome *</label>
            <input
              type="text"
              className={`form-input ${errors.name ? "error" : ""}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do projeto"
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Descrição</label>
            <textarea
              className="form-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição opcional"
              rows={3}
            />
          </div>
          {project && (
            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as Project["status"])}
              >
                <option value="active">Ativo</option>
                <option value="completed">Concluído</option>
                <option value="on_hold">Pausado</option>
              </select>
            </div>
          )}
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? <FiLoader className="spinner" /> : <FiSave />}
              {submitting ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
