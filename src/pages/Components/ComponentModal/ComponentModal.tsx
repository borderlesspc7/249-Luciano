import React, { useState, useEffect } from "react";
import type {
  Component,
  CreateComponentData,
  UpdateComponentData,
} from "../../../types/components";
import type { Project } from "../../../types/projects";
import type { Machine } from "../../../types/machines";
import { FiX, FiSave, FiLoader } from "react-icons/fi";
import "../../Projects/ProjectModal/ProjectModal.css";

interface ComponentModalProps {
  component?: Component | null;
  projects: Project[];
  machines: Machine[];
  onSave: (data: CreateComponentData | UpdateComponentData) => void;
  onClose: () => void;
}

export const ComponentModal: React.FC<ComponentModalProps> = ({
  component,
  projects,
  machines,
  onSave,
  onClose,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "",
    serialNumber: "",
    manufacturer: "",
    model: "",
    projectId: "",
    machineId: "",
    installationDate: "",
    status: "pending" as
      | "pending"
      | "installed"
      | "tested"
      | "approved"
      | "rejected",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!component;

  useEffect(() => {
    if (component) {
      setFormData({
        name: component.name,
        description: component.description || "",
        type: component.type,
        serialNumber: component.serialNumber || "",
        manufacturer: component.manufacturer || "",
        model: component.model || "",
        projectId: component.projectId,
        machineId: component.machineId || "",
        installationDate: component.installationDate
          ? component.installationDate.toISOString().split("T")[0]
          : "",
        status: component.status,
      });
    } else {
      setFormData({
        name: "",
        description: "",
        type: "",
        serialNumber: "",
        manufacturer: "",
        model: "",
        projectId: "",
        machineId: "",
        installationDate: "",
        status: "pending",
      });
    }
    setErrors({});
  }, [component]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Nome é obrigatório";
    }
    if (!formData.type.trim()) {
      newErrors.type = "Tipo é obrigatório";
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
      const submitData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        type: formData.type.trim(),
        serialNumber: formData.serialNumber.trim() || undefined,
        manufacturer: formData.manufacturer.trim() || undefined,
        model: formData.model.trim() || undefined,
        projectId: formData.projectId,
        machineId: formData.machineId || undefined,
        installationDate: formData.installationDate
          ? new Date(formData.installationDate)
          : undefined,
        ...(isEditing && { status: formData.status }),
      };

      await onSave(submitData);
    } catch (error) {
      console.error("Error saving component:", error);
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
          <h2>{isEditing ? "Editar Componente" : "Novo Componente"}</h2>
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
              Nome *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className={`form-input ${errors.name ? "error" : ""}`}
              placeholder="Digite o nome do componente"
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
              <input
                type="text"
                id="type"
                value={formData.type}
                onChange={(e) => handleInputChange("type", e.target.value)}
                className={`form-input ${errors.type ? "error" : ""}`}
                placeholder="Ex: Sensor, Válvula, etc."
                disabled={isSubmitting}
              />
              {errors.type && (
                <span className="error-message">{errors.type}</span>
              )}
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

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="serialNumber" className="form-label">
                Número de Série
              </label>
              <input
                type="text"
                id="serialNumber"
                value={formData.serialNumber}
                onChange={(e) =>
                  handleInputChange("serialNumber", e.target.value)
                }
                className="form-input"
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="manufacturer" className="form-label">
                Fabricante
              </label>
              <input
                type="text"
                id="manufacturer"
                value={formData.manufacturer}
                onChange={(e) =>
                  handleInputChange("manufacturer", e.target.value)
                }
                className="form-input"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="model" className="form-label">
                Modelo
              </label>
              <input
                type="text"
                id="model"
                value={formData.model}
                onChange={(e) => handleInputChange("model", e.target.value)}
                className="form-input"
                disabled={isSubmitting}
              />
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
                    handleInputChange("status", e.target.value)
                  }
                  className="form-input"
                  disabled={isSubmitting}
                >
                  <option value="pending">Pendente</option>
                  <option value="installed">Instalado</option>
                  <option value="tested">Testado</option>
                  <option value="approved">Aprovado</option>
                  <option value="rejected">Rejeitado</option>
                </select>
              </div>
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
              className="form-input"
              placeholder="Descreva o componente"
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="installationDate" className="form-label">
              Data de Instalação
            </label>
            <input
              type="date"
              id="installationDate"
              value={formData.installationDate}
              onChange={(e) =>
                handleInputChange("installationDate", e.target.value)
              }
              className="form-input"
              disabled={isSubmitting}
            />
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
