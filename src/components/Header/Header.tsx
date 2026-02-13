import React from "react";
import { useAuth } from "../../hooks/useAuth";
import { FiSearch, FiUser, FiLogOut, FiSettings } from "react-icons/fi";
import "./Header.css";

interface HeaderProps {
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isSidebarCollapsed,
  onToggleSidebar,
}) => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  return (
    <header
      className={`header ${
        isSidebarCollapsed ? "sidebar-collapsed" : "sidebar-expanded"
      }`}
    >
      <div className="header-left">
        <button
          className="sidebar-toggle-btn"
          onClick={onToggleSidebar}
          aria-label={
            isSidebarCollapsed ? "Expandir sidebar" : "Colapsar sidebar"
          }
        >
          <div className={`hamburger ${isSidebarCollapsed ? "collapsed" : ""}`}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </button>

        <div className="header-title">
          <h1>Sistema Singenta</h1>
          <span className="header-subtitle">Painel de Controle</span>
        </div>
      </div>

      <div className="header-center">
        <div className="search-container">
          <FiSearch className="search-icon" />
          <input type="text" placeholder="Buscar..." className="search-input" />
        </div>
      </div>

      <div className="header-right">
        <div className="user-menu">
          <div className="user-info">
            <div className="user-avatar">
              <FiUser />
            </div>
            <div className="user-details">
              <span className="user-name">{user?.name || user?.email || "Usuário"}</span>
              <span className="user-role">
                {user?.role === "admin" ? "Administrador" : "Usuário"}
              </span>
            </div>
          </div>

          <div className="user-actions">
            <button className="action-btn" aria-label="Configurações">
              <FiSettings />
            </button>
            <button
              className="action-btn logout-btn"
              onClick={handleLogout}
              aria-label="Sair"
            >
              <FiLogOut />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
