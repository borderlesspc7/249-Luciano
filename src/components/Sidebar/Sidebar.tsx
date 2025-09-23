import React from "react";
import { Link, useLocation } from "react-router-dom";
import { paths } from "../../routes/paths";
import { FiSettings, FiUsers, FiHome } from "react-icons/fi";
import "./Sidebar.css";

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed }) => {
  const location = useLocation();

  const navItems = [
    {
      path: paths.menu,
      label: "Máquinas",
      icon: FiSettings,
      description: "Gerenciar máquinas e processos",
    },
    {
      path: paths.users,
      label: "Usuários",
      icon: FiUsers,
      description: "Gerenciar usuários do sistema",
    },
  ];

  return (
    <aside className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <FiHome className="brand-icon" />
          {!isCollapsed && <span className="brand-text">Sistema Singenta</span>}
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          <div className="nav-title">Navegação</div>
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive ? "active" : ""}`}
                title={isCollapsed ? item.description : ""}
              >
                <IconComponent className="nav-icon" />
                {!isCollapsed && (
                  <span className="nav-label">{item.label}</span>
                )}
                {isActive && <div className="active-indicator" />}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-info">
          {!isCollapsed && (
            <div className="version-info">
              <span className="version">v1.0.0</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
