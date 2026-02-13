import React, { useState } from "react";
import { FiX, FiCopy, FiMail, FiCheck } from "react-icons/fi";
import { InviteService } from "../../../services/inviteService";
import type { Invite } from "../../../services/inviteService";
import "./InviteModal.css";

interface InviteModalProps {
  onClose: () => void;
  onSuccess: () => void;
  createdBy: string;
}

export const InviteModal: React.FC<InviteModalProps> = ({
  onClose,
  onSuccess,
  createdBy,
}) => {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "user">("user");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [invite, setInvite] = useState<Invite | null>(null);
  const [copied, setCopied] = useState(false);

  const inviteLink =
    invite &&
    `${typeof window !== "undefined" ? window.location.origin : ""}/accept-invite?token=${invite.token}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError("Email é obrigatório.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Email inválido.");
      return;
    }
    setSubmitting(true);
    try {
      const created = await InviteService.createInvite(
        { email: trimmed, role },
        createdBy
      );
      setInvite(created);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar convite.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleClose = () => {
    if (!submitting) onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-container invite-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{invite ? "Convite criado" : "Convidar usuário"}</h2>
          <button
            type="button"
            className="modal-close"
            onClick={handleClose}
            disabled={submitting}
            aria-label="Fechar"
          >
            <FiX />
          </button>
        </div>

        {invite ? (
          <div className="invite-result">
            <p>Envie este link para <strong>{invite.email}</strong>:</p>
            <div className="invite-link-box">
              <code>{inviteLink}</code>
            </div>
            <button
              type="button"
              className="btn-primary invite-copy-btn"
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <FiCheck /> Copiado
                </>
              ) : (
                <>
                  <FiCopy /> Copiar link
                </>
              )}
            </button>
            <p className="invite-hint">O link expira quando o usuário ativar a conta.</p>
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={handleClose}>
                Fechar
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="modal-form">
            <div className="form-group">
              <label htmlFor="invite-email" className="form-label">
                <FiMail className="label-icon" />
                Email *
              </label>
              <input
                id="invite-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`form-input ${error ? "error" : ""}`}
                placeholder="email@empresa.com"
                disabled={submitting}
              />
            </div>
            <div className="form-group">
              <label htmlFor="invite-role" className="form-label">
                Perfil *
              </label>
              <select
                id="invite-role"
                value={role}
                onChange={(e) => setRole(e.target.value as "admin" | "user")}
                className="form-select"
                disabled={submitting}
              >
                <option value="user">Usuário</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            {error && <p className="error-message">{error}</p>}
            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={handleClose}
                disabled={submitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={submitting}
              >
                {submitting ? "Criando..." : "Gerar link de convite"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
