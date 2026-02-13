import React, { useState, useEffect } from "react";
import type {
  Project,
  CreateProjectData,
  UpdateProjectData,
} from "../../../types/projects";
import type { UserManagement } from "../../../types/userManagement";
import { FiX, FiSave, FiLoader } from "react-icons/fi";
import "./ProjectModal.css";

interface ProjectModalProps {
  project?: Project | null;
  users: UserManagement[];
  onSave: (data: CreateProjectData | UpdateProjectData) => void;
  onClose: () => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  project,
  users,
  onSave,
  onClose,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startDate: new Date().toISOString().split("T")[0],
    expectedEndDate: "",
    managerId: "",
    status: "active" as "active" | "completed" | "overdue" | "cancelled",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!project;

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name,
        description: project.description || "",
        startDate: project.startDate.toISOString().split("T")[0],
        expectedEndDate: project.expectedEndDate
          ? project.expectedEndDate.toISOString().split("T")[0]
          : "",
        managerId: project.managerId || "",
        status: project.status,
      });
    } else {
      setFormData({
        name: "",
        description: "",
        startDate: new Date().toISOString().split("T")[0],
        expectedEndDate: "",
        managerId: "",
        status: "active",
      });
    }
    setErrors({});
  }, [project]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Nome é obrigatório";
    } else if (formData.name.trim().length < 3) {
      newErrors.name = "Nome deve ter pelo menos 3 caracteres";
    }

    if (!formData.startDate) {
      newErrors.startDate = "Data de início é obrigatória";
    }

    if (
      formData.expectedEndDate &&
      formData.startDate &&
      new Date(formData.expectedEndDate) < new Date(formData.startDate)
    ) {
      newErrors.expectedEndDate =
        "Data prevista deve ser posterior à data de início";
    }

    if (formData.description && formData.description.length > 1000) {
      newErrors.description = "Descrição deve ter no máximo 1000 caracteres";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        startDate: new Date(formData.startDate),
        expectedEndDate: formData.expectedEndDate
          ? new Date(formData.expectedEndDate)
          : undefined,
        managerId: formData.managerId || undefined,
        ...(isEditing && { status: formData.status }),
      };

      await onSave(submitData);
    } catch (error) {
      console.error("Error saving project:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            {isEditing ? "Editar Projeto" : "Novo Projeto"}
          </h2>
          <button
            className="modal-close"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="name" className="form-label">
              Nome do Projeto *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className={`form-input ${errors.name ? "error" : ""}`}
              placeholder="Digite o nome do projeto"
              disabled={isSubmitting}
            />
            {errors.name && (
              <span className="error-message">{errors.name}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="description" className="form-label">
              Descrição
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              className={`form-input ${errors.description ? "error" : ""}`}
              placeholder="Descreva o projeto"
              rows={4}
              disabled={isSubmitting}
            />
            {errors.description && (
              <span className="error-message">{errors.description}</span>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startDate" className="form-label">
                Data de Início *
              </label>
              <input
                type="date"
                id="startDate"
                value={formData.startDate}
                onChange={(e) => handleInputChange("startDate", e.target.value)}
                className={`form-input ${errors.startDate ? "error" : ""}`}
                disabled={isSubmitting}
              />
              {errors.startDate && (
                <span className="error-message">{errors.startDate}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="expectedEndDate" className="form-label">
                Data Prevista de Término
              </label>
              <input
                type="date"
                id="expectedEndDate"
                value={formData.expectedEndDate}
                onChange={(e) =>
                  handleInputChange("expectedEndDate", e.target.value)
                }
                className={`form-input ${errors.expectedEndDate ? "error" : ""}`}
                disabled={isSubmitting}
              />
              {errors.expectedEndDate && (
                <span className="error-message">{errors.expectedEndDate}</span>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="managerId" className="form-label">
                Gerente do Projeto
              </label>
              <select
                id="managerId"
                value={formData.managerId}
                onChange={(e) => handleInputChange("managerId", e.target.value)}
                className="form-input"
                disabled={isSubmitting}
              >
                <option value="">Selecione um gerente</option>
                {users
                  .filter((u) => u.status === "active")
                  .map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
              </select>
            </div>

            {isEditing && (
              <div className="form-group">
                <label htmlFor="status" className="form-label">
                  Status
                </label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) =>
                    handleInputChange(
                      "status",
                      e.target.value
                    )
                  }
                  className="form-input"
                  disabled={isSubmitting}
                >
                  <option value="active">Ativo</option>
                  <option value="completed">Concluído</option>
                  <option value="overdue">Em Atraso</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <FiLoader className="spinner" />
                  Salvando...
                </>
              ) : (
                <>
                  <FiSave />
                  Salvar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
