import React from "react";
import { FiAlertTriangle, FiTrash2, FiLoader } from "react-icons/fi";
import "./DeleteConfirmModal.css";

interface DeleteConfirmModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  title,
  message,
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="delete-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="delete-modal-header">
          <div className="delete-icon">
            <FiAlertTriangle />
          </div>
          <h2>{title}</h2>
        </div>

        <div className="delete-modal-content">
          <p>{message}</p>
        </div>

        <div className="delete-modal-actions">
          <button
            type="button"
            className="btn-cancel"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn-delete"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <FiLoader className="spinner" />
                Excluindo...
              </>
            ) : (
              <>
                <FiTrash2 />
                Excluir
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
