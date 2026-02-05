import React, { useState, useEffect } from "react";
import type {
  UserManagement,
  CreateUserData,
  UpdateUserData,
  UserStats,
} from "../../types/userManagement";
import { UserService } from "../../services/userService";
import { useAuth } from "../../hooks/useAuth";
import { UserModal } from "./UserModal/UserModal";
import { DeleteConfirmModal } from "./DeleteConfirmModal/DeleteConfirmModal";
import {
  FiPlus,
  FiEdit3,
  FiTrash2,
  FiUsers,
  FiAlertTriangle,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiShield,
  FiUser,
  FiPhone,
  FiCalendar,
  FiActivity,
} from "react-icons/fi";
import "./Users.css";

export const UsersPage: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserManagement[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserManagement | null>(null);
  const [deleteUser, setDeleteUser] = useState<UserManagement | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<"all" | "admin" | "user">("all");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "inactive" | "suspended"
  >("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [usersData, statsData] = await Promise.all([
        UserService.getUsers(),
        UserService.getUserStats(),
      ]);
      setUsers(usersData);
      setStats(statsData);
    } catch (err) {
      setError("Erro ao carregar dados. Tente novamente.");
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (data: CreateUserData) => {
    if (!user) return;

    try {
      await UserService.createUser(data, user.uid);
      await loadData();
      setIsModalOpen(false);
    } catch (err) {
      setError("Erro ao criar usuário. Tente novamente.");
      console.error("Error creating user:", err);
    }
  };

  const handleUpdateUser = async (data: UpdateUserData) => {
    if (!user || !editingUser) return;

    try {
      await UserService.updateUser(editingUser.id, data, user.uid);
      await loadData();
      setEditingUser(null);
      setIsModalOpen(false);
    } catch (err) {
      setError("Erro ao atualizar usuário. Tente novamente.");
      console.error("Error updating user:", err);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUser) return;

    try {
      await UserService.deleteUser(deleteUser.id);
      await loadData();
      setDeleteUser(null);
    } catch (err) {
      setError("Erro ao excluir usuário. Tente novamente.");
      console.error("Error deleting user:", err);
    }
  };

  const handleEdit = (user: UserManagement) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleDelete = (user: UserManagement) => {
    setDeleteUser(user);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "all" || user.role === filterRole;
    const matchesStatus =
      filterStatus === "all" || user.status === filterStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: {
        text: "Ativo",
        className: "status-active",
        icon: FiCheckCircle,
      },
      inactive: {
        text: "Inativo",
        className: "status-inactive",
        icon: FiXCircle,
      },
      suspended: {
        text: "Suspenso",
        className: "status-suspended",
        icon: FiClock,
      },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    const IconComponent = config.icon;
    return (
      <span className={`status-badge ${config.className}`}>
        <IconComponent className="status-icon" />
        {config.text}
      </span>
    );
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      admin: {
        text: "Administrador",
        className: "role-admin",
        icon: FiShield,
      },
      user: {
        text: "Usuário",
        className: "role-user",
        icon: FiUser,
      },
    };

    const config =
      roleConfig[role as keyof typeof roleConfig] || roleConfig.user;
    const IconComponent = config.icon;
    return (
      <span className={`role-badge ${config.className}`}>
        <IconComponent className="role-icon" />
        {config.text}
      </span>
    );
  };

  const formatLastLogin = (lastLoginAt?: Date) => {
    if (!lastLoginAt) return "Nunca";

    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - lastLoginAt.getTime()) / (1000 * 60 * 60),
    );

    if (diffInHours < 1) return "Agora";
    if (diffInHours < 24) return `${diffInHours}h atrás`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d atrás`;
    return lastLoginAt.toLocaleDateString("pt-BR");
  };

  if (loading) {
    return (
      <div className="users-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Carregando usuários...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="users-page">
      <div className="users-header">
        <div className="header-content">
          <h1>Gestão de Usuários</h1>
          <p>Gerencie usuários, permissões e acessos do sistema</p>
        </div>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <FiPlus className="btn-icon" />
          Novo Usuário
        </button>
      </div>

      {error && (
        <div className="error-message">
          <FiAlertTriangle className="error-icon" />
          {error}
          <button onClick={() => setError(null)} className="error-close">
            <FiXCircle />
          </button>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="stats-container">
          <div className="stat-card">
            <div className="stat-icon">
              <FiUsers />
            </div>
            <div className="stat-content">
              <h3>{stats.totalUsers}</h3>
              <p>Total de Usuários</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon active">
              <FiCheckCircle />
            </div>
            <div className="stat-content">
              <h3>{stats.activeUsers}</h3>
              <p>Usuários Ativos</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon admin">
              <FiShield />
            </div>
            <div className="stat-content">
              <h3>{stats.adminUsers}</h3>
              <p>Administradores</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon recent">
              <FiActivity />
            </div>
            <div className="stat-content">
              <h3>{stats.recentLogins}</h3>
              <p>Logins Recentes</p>
            </div>
          </div>
        </div>
      )}

      <div className="users-filters">
        <div className="filter-group">
          <input
            type="text"
            placeholder="Buscar por nome, email ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-group">
          <select
            value={filterRole}
            onChange={(e) =>
              setFilterRole(e.target.value as "all" | "admin" | "user")
            }
            className="filter-select"
          >
            <option value="all">Todos os perfis</option>
            <option value="admin">Administradores</option>
            <option value="user">Usuários</option>
          </select>
        </div>

        <div className="filter-group">
          <select
            value={filterStatus}
            onChange={(e) =>
              setFilterStatus(
                e.target.value as "all" | "active" | "inactive" | "suspended",
              )
            }
            className="filter-select"
          >
            <option value="all">Todos os status</option>
            <option value="active">Ativo</option>
            <option value="inactive">Inativo</option>
            <option value="suspended">Suspenso</option>
          </select>
        </div>
      </div>

      <div className="users-content">
        {filteredUsers.length === 0 ? (
          <div className="empty-state">
            <FiUsers className="empty-icon" />
            <h3>Nenhum usuário encontrado</h3>
            <p>
              {searchTerm || filterRole !== "all" || filterStatus !== "all"
                ? "Tente ajustar os filtros de busca"
                : "Comece criando seu primeiro usuário"}
            </p>
            {!searchTerm && filterRole === "all" && filterStatus === "all" && (
              <button
                className="btn-primary"
                onClick={() => setIsModalOpen(true)}
              >
                <FiPlus className="btn-icon" />
                Criar primeiro usuário
              </button>
            )}
          </div>
        ) : (
          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Usuário</th>
                  <th>Perfil</th>
                  <th>Status</th>
                  <th>Contato</th>
                  <th>Último Login</th>
                  <th>Criado em</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="user-info">
                        <div className="user-avatar">
                          <FiUser />
                        </div>
                        <div className="user-details">
                          <strong>{user.name}</strong>
                          <span className="user-email">{user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>{getRoleBadge(user.role)}</td>
                    <td>{getStatusBadge(user.status)}</td>
                    <td>
                      <div className="contact-info">
                        {user.phone ? (
                          <div className="contact-item">
                            <FiPhone className="contact-icon" />
                            <span>{user.phone}</span>
                          </div>
                        ) : (
                          <span className="no-contact">Sem telefone</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="last-login">
                        <FiCalendar className="login-icon" />
                        <span>{formatLastLogin(user.lastLoginAt)}</span>
                      </div>
                    </td>
                    <td>
                      <div className="user-date">
                        {user.createdAt.toLocaleDateString("pt-BR")}
                      </div>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="btn-icon btn-edit"
                          onClick={() => handleEdit(user)}
                          title="Editar"
                        >
                          <FiEdit3 />
                        </button>
                        <button
                          className="btn-icon btn-delete"
                          onClick={() => handleDelete(user)}
                          title="Excluir"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <UserModal
          user={editingUser}
          onSave={
            editingUser
              ? (data) => handleUpdateUser(data as UpdateUserData)
              : (data) => handleCreateUser(data as CreateUserData)
          }
          onClose={handleCloseModal}
        />
      )}

      {deleteUser && (
        <DeleteConfirmModal
          title="Excluir Usuário"
          message={`Tem certeza que deseja excluir o usuário "${deleteUser.name}"? Esta ação não pode ser desfeita.`}
          onConfirm={handleDeleteUser}
          onCancel={() => setDeleteUser(null)}
        />
      )}
    </div>
  );
};
