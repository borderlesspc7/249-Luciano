import React from "react";
import { Link, useLocation } from "react-router-dom";
import { paths } from "../../routes/paths";
import { FiSettings, FiUsers, FiHome } from "react-icons/fi";
import "./Navigation.css";

export const Navigation: React.FC = () => {
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
    <nav className="navigation">
      <div className="nav-container">
        <div className="nav-brand">
          <FiHome className="brand-icon" />
          <span className="brand-text">Sistema Singenta</span>
        </div>

        <div className="nav-items">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive ? "active" : ""}`}
                title={item.description}
              >
                <IconComponent className="nav-icon" />
                <span className="nav-label">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
