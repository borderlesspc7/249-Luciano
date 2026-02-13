import React, { useState, useEffect } from "react";
import type {
  CommissioningStep,
  CreateCommissioningStepData,
  UpdateCommissioningStepData,
  CommissioningStepType,
  StepStatus,
} from "../../../types/commissioning";
import type { Project } from "../../../types/projects";
import type { Component } from "../../../types/components";
import type { Machine } from "../../../types/machines";
import type { UserManagement } from "../../../types/userManagement";
import { FiX, FiSave, FiLoader } from "react-icons/fi";
import "../../Projects/ProjectModal/ProjectModal.css";

interface StepModalProps {
  step?: CommissioningStep | null;
  projects: Project[];
  components: Component[];
  machines: Machine[];
  users: UserManagement[];
  onSave: (data: CreateCommissioningStepData | UpdateCommissioningStepData) => void;
  onClose: () => void;
}

export const StepModal: React.FC<StepModalProps> = ({
  step,
  projects,
  components,
  machines,
  users,
  onSave,
  onClose,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "visual_inspection" as CommissioningStepType,
    projectId: "",
    componentId: "",
    machineId: "",
    assignedTo: "",
    dueDate: "",
    status: "pending" as StepStatus,
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!step;

  useEffect(() => {
    if (step) {
      setFormData({
        name: step.name,
        description: step.description || "",
        type: step.type,
        projectId: step.projectId,
        componentId: step.componentId || "",
        machineId: step.machineId || "",
        assignedTo: step.assignedTo || "",
        dueDate: step.dueDate
          ? step.dueDate.toISOString().split("T")[0]
          : "",
        status: step.status,
        notes: step.notes || "",
      });
    } else {
      setFormData({
        name: "",
        description: "",
        type: "visual_inspection",
        projectId: "",
        componentId: "",
        machineId: "",
        assignedTo: "",
        dueDate: "",
        status: "pending",
        notes: "",
      });
    }
    setErrors({});
  }, [step]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Nome é obrigatório";
    }
    if (!formData.projectId) {
      newErrors.projectId = "Projeto é obrigatório";
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
      const submitData = isEditing
        ? {
            status: formData.status,
            notes: formData.notes,
            assignedTo: formData.assignedTo || undefined,
            dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
          }
        : {
            name: formData.name.trim(),
            description: formData.description.trim() || undefined,
            type: formData.type,
            projectId: formData.projectId,
            componentId: formData.componentId || undefined,
            machineId: formData.machineId || undefined,
            assignedTo: formData.assignedTo || undefined,
            dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
          };

      await onSave(submitData);
    } catch (error) {
      console.error("Error saving step:", error);
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

  const filteredComponents = formData.projectId
    ? components.filter((c) => c.projectId === formData.projectId)
    : components;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditing ? "Editar Etapa" : "Nova Etapa"}</h2>
          <button
            className="modal-close"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {!isEditing && (
            <>
              <div className="form-group">
                <label htmlFor="name" className="form-label">
                  Nome da Etapa *
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className={`form-input ${errors.name ? "error" : ""}`}
                  placeholder="Digite o nome da etapa"
                  disabled={isSubmitting}
                />
                {errors.name && (
                  <span className="error-message">{errors.name}</span>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="type" className="form-label">
                    Tipo *
                  </label>
                  <select
                    id="type"
                    value={formData.type}
                    onChange={(e) =>
                      handleInputChange("type", e.target.value)
                    }
                    className="form-input"
                    disabled={isSubmitting}
                  >
                    <option value="visual_inspection">Inspeção Visual</option>
                    <option value="functional_test">Teste Funcional</option>
                    <option value="performance_test">Teste de Performance</option>
                    <option value="safety_test">Teste de Segurança</option>
                    <option value="documentation">Documentação</option>
                    <option value="approval">Aprovação</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="projectId" className="form-label">
                    Projeto *
                  </label>
                  <select
                    id="projectId"
                    value={formData.projectId}
                    onChange={(e) => handleInputChange("projectId", e.target.value)}
                    className={`form-input ${errors.projectId ? "error" : ""}`}
                    disabled={isSubmitting}
                  >
                    <option value="">Selecione um projeto</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                  {errors.projectId && (
                    <span className="error-message">{errors.projectId}</span>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="componentId" className="form-label">
                    Componente
                  </label>
                  <select
                    id="componentId"
                    value={formData.componentId}
                    onChange={(e) =>
                      handleInputChange("componentId", e.target.value)
                    }
                    className="form-input"
                    disabled={isSubmitting || !formData.projectId}
                  >
                    <option value="">Selecione um componente</option>
                    {filteredComponents.map((component) => (
                      <option key={component.id} value={component.id}>
                        {component.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="machineId" className="form-label">
                    Máquina
                  </label>
                  <select
                    id="machineId"
                    value={formData.machineId}
                    onChange={(e) => handleInputChange("machineId", e.target.value)}
                    className="form-input"
                    disabled={isSubmitting}
                  >
                    <option value="">Selecione uma máquina</option>
                    {machines.map((machine) => (
                      <option key={machine.id} value={machine.id}>
                        {machine.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="description" className="form-label">
                  Descrição
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  className="form-input"
                  placeholder="Descreva a etapa"
                  rows={3}
                  disabled={isSubmitting}
                />
              </div>
            </>
          )}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="assignedTo" className="form-label">
                Responsável
              </label>
              <select
                id="assignedTo"
                value={formData.assignedTo}
                onChange={(e) => handleInputChange("assignedTo", e.target.value)}
                className="form-input"
                disabled={isSubmitting}
              >
                <option value="">Selecione um responsável</option>
                {users
                  .filter((u) => u.status === "active")
                  .map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="dueDate" className="form-label">
                Prazo
              </label>
              <input
                type="date"
                id="dueDate"
                value={formData.dueDate}
                onChange={(e) => handleInputChange("dueDate", e.target.value)}
                className="form-input"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {isEditing && (
            <>
              <div className="form-group">
                <label htmlFor="status" className="form-label">
                  Status
                </label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) =>
                    handleInputChange("status", e.target.value)
                  }
                  className="form-input"
                  disabled={isSubmitting}
                >
                  <option value="pending">Pendente</option>
                  <option value="in_progress">Em Andamento</option>
                  <option value="completed">Concluída</option>
                  <option value="failed">Falhou</option>
                  <option value="skipped">Pulada</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="notes" className="form-label">
                  Observações
                </label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  className="form-input"
                  placeholder="Adicione observações sobre a etapa"
                  rows={4}
                  disabled={isSubmitting}
                />
              </div>
            </>
          )}

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
