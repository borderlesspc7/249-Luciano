import React, { useState, useEffect } from "react";
import type {
  UserManagement,
  CreateUserData,
  UpdateUserData,
} from "../../../types/userManagement";
import {
  FiX,
  FiSave,
  FiLoader,
  FiUser,
  FiMail,
  FiPhone,
  FiShield,
  FiEye,
  FiEyeOff,
} from "react-icons/fi";
import "./UserModal.css";

interface UserModalProps {
  user?: UserManagement | null;
  onSave: (data: CreateUserData | UpdateUserData) => void;
  onClose: () => void;
}

export const UserModal: React.FC<UserModalProps> = ({
  user,
  onSave,
  onClose,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user" as "admin" | "user",
    phone: "",
    status: "active" as "active" | "inactive" | "suspended",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isEditing = !!user;

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        password: "", // Don't pre-fill password for security
        role: user.role,
        phone: user.phone || "",
        status: user.status,
      });
    } else {
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "user",
        phone: "",
        status: "active",
      });
    }
    setErrors({});
  }, [user]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Nome é obrigatório";
    } else if (formData.name.trim().length < 3) {
      newErrors.name = "Nome deve ter pelo menos 3 caracteres";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email é obrigatório";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = "Email inválido";
    }

    if (!isEditing && !formData.password.trim()) {
      newErrors.password = "Senha é obrigatória";
    } else if (!isEditing && formData.password.length < 6) {
      newErrors.password = "Senha deve ter pelo menos 6 caracteres";
    }

    if (!formData.role) {
      newErrors.role = "Perfil é obrigatório";
    }

    if (formData.phone && !/^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(formData.phone)) {
      newErrors.phone = "Telefone deve estar no formato (11) 99999-9999";
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
        email: formData.email.trim(),
        role: formData.role,
        phone: formData.phone.trim() || undefined,
        ...(isEditing && { status: formData.status }),
        ...(!isEditing && { password: formData.password }),
      };

      await onSave(submitData);
    } catch (error) {
      console.error("Error saving user:", error);
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

  const handlePhoneChange = (value: string) => {
    // Format phone number as user types
    const cleaned = value.replace(/\D/g, "");
    let formatted = cleaned;

    if (cleaned.length >= 2) {
      formatted = `(${cleaned.slice(0, 2)})`;
      if (cleaned.length > 2) {
        formatted += ` ${cleaned.slice(2, 7)}`;
        if (cleaned.length > 7) {
          formatted += `-${cleaned.slice(7, 11)}`;
        }
      }
    }

    handleInputChange("phone", formatted);
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
          <h2>{isEditing ? "Editar Usuário" : "Novo Usuário"}</h2>
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
              <FiUser className="label-icon" />
              Nome *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className={`form-input ${errors.name ? "error" : ""}`}
              placeholder="Digite o nome completo"
              disabled={isSubmitting}
            />
            {errors.name && (
              <span className="error-message">{errors.name}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              <FiMail className="label-icon" />
              Email *
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className={`form-input ${errors.email ? "error" : ""}`}
              placeholder="Digite o email"
              disabled={isSubmitting}
            />
            {errors.email && (
              <span className="error-message">{errors.email}</span>
            )}
          </div>

          {!isEditing && (
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                <FiShield className="label-icon" />
                Senha *
              </label>
              <div className="password-input-container">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  className={`form-input ${errors.password ? "error" : ""}`}
                  placeholder="Digite a senha"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isSubmitting}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {errors.password && (
                <span className="error-message">{errors.password}</span>
              )}
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="role" className="form-label">
                <FiShield className="label-icon" />
                Perfil *
              </label>
              <select
                id="role"
                value={formData.role}
                onChange={(e) => handleInputChange("role", e.target.value)}
                className={`form-select ${errors.role ? "error" : ""}`}
                disabled={isSubmitting}
              >
                <option value="user">Usuário</option>
                <option value="admin">Administrador</option>
              </select>
              {errors.role && (
                <span className="error-message">{errors.role}</span>
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
                  <option value="suspended">Suspenso</option>
                </select>
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="phone" className="form-label">
              <FiPhone className="label-icon" />
              Telefone
            </label>
            <input
              type="text"
              id="phone"
              value={formData.phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              className={`form-input ${errors.phone ? "error" : ""}`}
              placeholder="(11) 99999-9999"
              disabled={isSubmitting}
            />
            {errors.phone && (
              <span className="error-message">{errors.phone}</span>
            )}
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
                  {isEditing ? "Salvar Alterações" : "Criar Usuário"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
