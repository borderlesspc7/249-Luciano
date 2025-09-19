import React, { useState, useEffect } from "react";
import type {
  Machine,
  Cluster,
  CreateMachineData,
  UpdateMachineData,
} from "../../../types/machines";
import { FiX, FiSave, FiLoader } from "react-icons/fi";
import "./MachineModal.css";

interface MachineModalProps {
  machine?: Machine | null;
  clusters: Cluster[];
  onSave: (data: CreateMachineData | UpdateMachineData) => void;
  onClose: () => void;
}

export const MachineModal: React.FC<MachineModalProps> = ({
  machine,
  clusters,
  onSave,
  onClose,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    type: "machine" as "machine" | "process",
    description: "",
    clusterId: "",
    status: "active" as "active" | "inactive" | "maintenance",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!machine;

  useEffect(() => {
    if (machine) {
      setFormData({
        name: machine.name,
        type: machine.type,
        description: machine.description || "",
        clusterId: machine.clusterId || "",
        status: machine.status,
      });
    } else {
      setFormData({
        name: "",
        type: "machine",
        description: "",
        clusterId: "",
        status: "active",
      });
    }
    setErrors({});
  }, [machine]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Nome é obrigatório";
    } else if (formData.name.trim().length < 3) {
      newErrors.name = "Nome deve ter pelo menos 3 caracteres";
    }

    if (!formData.type) {
      newErrors.type = "Tipo é obrigatório";
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = "Descrição deve ter no máximo 500 caracteres";
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
        type: formData.type,
        description: formData.description.trim() || undefined,
        clusterId: formData.clusterId || undefined,
        ...(isEditing && { status: formData.status }),
      };

      await onSave(submitData);
    } catch (error) {
      console.error("Error saving machine:", error);
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
            {isEditing ? "Editar Máquina/Processo" : "Nova Máquina/Processo"}
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
              Nome *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className={`form-input ${errors.name ? "error" : ""}`}
              placeholder="Digite o nome da máquina ou processo"
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
                onChange={(e) => handleInputChange("type", e.target.value)}
                className={`form-select ${errors.type ? "error" : ""}`}
                disabled={isSubmitting}
              >
                <option value="machine">Máquina</option>
                <option value="process">Processo</option>
              </select>
              {errors.type && (
                <span className="error-message">{errors.type}</span>
              )}
            </div>

            {isEditing && (
              <div className="form-group">
                <label htmlFor="status" className="form-label">
                  Status
                </label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => handleInputChange("status", e.target.value)}
                  className="form-select"
                  disabled={isSubmitting}
                >
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                  <option value="maintenance">Manutenção</option>
                </select>
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="clusterId" className="form-label">
              Cluster
            </label>
            <select
              id="clusterId"
              value={formData.clusterId}
              onChange={(e) => handleInputChange("clusterId", e.target.value)}
              className="form-select"
              disabled={isSubmitting}
            >
              <option value="">Selecione um cluster (opcional)</option>
              {clusters.map((cluster) => (
                <option key={cluster.id} value={cluster.id}>
                  {cluster.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="description" className="form-label">
              Descrição
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              className={`form-textarea ${errors.description ? "error" : ""}`}
              placeholder="Descreva a máquina ou processo (opcional)"
              rows={4}
              disabled={isSubmitting}
            />
            {errors.description && (
              <span className="error-message">{errors.description}</span>
            )}
            <div className="char-count">
              {formData.description.length}/500 caracteres
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary"
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
                  {isEditing ? "Salvando..." : "Criando..."}
                </>
              ) : (
                <>
                  <FiSave />
                  {isEditing ? "Salvar Alterações" : "Criar Máquina/Processo"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
