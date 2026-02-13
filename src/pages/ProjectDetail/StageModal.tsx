import React, { useState, useEffect } from "react";
import type { Stage, StageType } from "../../types/stages";
import { FiX, FiSave, FiLoader } from "react-icons/fi";

interface StageModalProps {
  projectId: string;
  stage: Stage | null;
  existingOrder: number;
  onSave: (data: { name: string; type: StageType; order: number }) => void;
  onClose: () => void;
}

export const StageModal: React.FC<StageModalProps> = ({ stage, existingOrder, onSave, onClose }) => {
  const [name, setName] = useState("");
  const [type, setType] = useState<StageType>("funcional");
  const [order, setOrder] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (stage) {
      setName(stage.name);
      setType(stage.type);
      setOrder(stage.order);
    } else {
      setName("");
      setType("funcional");
      setOrder(existingOrder);
    }
  }, [stage, existingOrder]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onSave({ name: name.trim(), type, order });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{stage ? "Editar etapa" : "Nova etapa"}</h2>
          <button type="button" className="modal-close" onClick={onClose} disabled={submitting}>
            <FiX />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Nome *</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Inspeção visual"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Tipo</label>
            <select
              className="form-select"
              value={type}
              onChange={(e) => setType(e.target.value as StageType)}
            >
              <option value="visual">Visual</option>
              <option value="funcional">Funcional</option>
              <option value="performance">Performance</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Ordem</label>
            <input
              type="number"
              min={0}
              className="form-input"
              value={order}
              onChange={(e) => setOrder(Number(e.target.value))}
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? <FiLoader className="spinner" /> : <FiSave />}
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
