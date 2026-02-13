import React, { useState, useEffect } from "react";
import type { Asset } from "../../types/assets";
import { FiX, FiSave, FiLoader } from "react-icons/fi";

interface AssetModalProps {
  projectId: string;
  asset: Asset | null;
  onSave: (data: { name: string; description?: string; type?: string }) => void;
  onClose: () => void;
}

export const AssetModal: React.FC<AssetModalProps> = ({ asset, onSave, onClose }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (asset) {
      setName(asset.name);
      setDescription(asset.description ?? "");
      setType(asset.type ?? "");
    } else {
      setName("");
      setDescription("");
      setType("");
    }
  }, [asset]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim() || undefined,
        type: type.trim() || undefined,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{asset ? "Editar equipamento" : "Novo equipamento"}</h2>
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
              placeholder="Nome do equipamento"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Tipo</label>
            <input
              type="text"
              className="form-input"
              value={type}
              onChange={(e) => setType(e.target.value)}
              placeholder="Ex: Bomba, Motor"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Descrição</label>
            <textarea
              className="form-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Opcional"
              rows={2}
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
