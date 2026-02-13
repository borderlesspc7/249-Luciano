import React, { useState, useEffect } from "react";
import type { Component } from "../../types/components";
import { FiX, FiSave, FiLoader } from "react-icons/fi";

interface ComponentModalProps {
  component: Component | null;
  onSave: (data: { name: string; description?: string }) => void;
  onClose: () => void;
}

export const ComponentModal: React.FC<ComponentModalProps> = ({ component, onSave, onClose }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (component) {
      setName(component.name);
      setDescription(component.description ?? "");
    } else {
      setName("");
      setDescription("");
    }
  }, [component]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onSave({ name: name.trim(), description: description.trim() || undefined });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{component ? "Editar componente" : "Novo componente"}</h2>
          <button type="button" className="modal-close" onClick={onClose} disabled={submitting}><FiX /></button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Nome *</label>
            <input type="text" className="form-input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Descrição</label>
            <textarea className="form-input" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? <FiLoader className="spinner" /> : <FiSave />} Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
