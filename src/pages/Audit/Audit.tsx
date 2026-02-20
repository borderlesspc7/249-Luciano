import React, { useState, useEffect } from "react";
import { AuditService } from "../../services/auditService";
import type { AuditLog, AuditAction, AuditEntity } from "../../types/audit";
import {
  FiFileText,
  FiSearch,
  FiCalendar,
  FiUser,
  FiActivity,
} from "react-icons/fi";
import "./Audit.css";

export const AuditPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState<AuditAction | "all">("all");
  const [filterEntity, setFilterEntity] = useState<AuditEntity | "all">("all");

  useEffect(() => {
    loadLogs();
  }, [filterAction, filterEntity]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const filter: any = {};
      if (filterAction !== "all") {
        filter.action = filterAction;
      }
      if (filterEntity !== "all") {
        filter.entity = filterEntity;
      }
      if (searchTerm) {
        filter.searchTerm = searchTerm;
      }

      const logsData = await AuditService.getAuditLogs(filter, 200);
      setLogs(logsData);
    } catch (err) {
      setError("Erro ao carregar logs de auditoria. Tente novamente.");
      console.error("Error loading audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadLogs();
  };

  const getActionLabel = (action: AuditAction): string => {
    const labels: Record<AuditAction, string> = {
      create: "Criar",
      update: "Atualizar",
      delete: "Excluir",
      view: "Visualizar",
      approve: "Aprovar",
      reject: "Rejeitar",
      login: "Login",
      logout: "Logout",
      export: "Exportar",
      upload: "Upload",
      download: "Download",
    };
    return labels[action] || action;
  };

  const getEntityLabel = (entity: AuditEntity): string => {
    const labels: Record<AuditEntity, string> = {
      project: "Projeto",
      component: "Componente",
      commissioning_step: "Etapa de Comissionamento",
      machine: "Máquina",
      user: "Usuário",
      report: "Relatório",
      evidence: "Evidência",
      approval: "Aprovação",
    };
    return labels[entity] || entity;
  };

  const getActionIcon = (action: AuditAction) => {
    switch (action) {
      case "create":
        return "➕";
      case "update":
        return "✏️";
      case "delete":
        return "🗑️";
      case "approve":
        return "✅";
      case "reject":
        return "❌";
      case "login":
        return "🔐";
      case "logout":
        return "🚪";
      default:
        return "📝";
    }
  };

  if (loading) {
    return (
      <div className="audit-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Carregando logs de auditoria...</p>
        </div>
      </div>
    );
  }

  const filteredLogs = logs.filter((log) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      log.description.toLowerCase().includes(searchLower) ||
      log.userName.toLowerCase().includes(searchLower) ||
      log.entityName?.toLowerCase().includes(searchLower) ||
      log.entityId.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="audit-page">
      <div className="audit-header">
        <div className="header-content">
          <h1>Trilha de Auditoria</h1>
          <p>Registro completo de todas as ações do sistema</p>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <FiActivity className="error-icon" />
          {error}
        </div>
      )}

      <div className="audit-filters">
        <div className="filter-group">
          <input
            type="text"
            placeholder="Buscar por descrição, usuário ou entidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            className="search-input"
          />
          <button className="btn-search" onClick={handleSearch}>
            <FiSearch />
          </button>
        </div>

        <div className="filter-group">
          <select
            value={filterAction}
            onChange={(e) =>
              setFilterAction(e.target.value as AuditAction | "all")
            }
            className="filter-select"
          >
            <option value="all">Todas as ações</option>
            <option value="create">Criar</option>
            <option value="update">Atualizar</option>
            <option value="delete">Excluir</option>
            <option value="view">Visualizar</option>
            <option value="approve">Aprovar</option>
            <option value="reject">Rejeitar</option>
            <option value="login">Login</option>
            <option value="logout">Logout</option>
            <option value="export">Exportar</option>
            <option value="upload">Upload</option>
            <option value="download">Download</option>
          </select>
        </div>

        <div className="filter-group">
          <select
            value={filterEntity}
            onChange={(e) =>
              setFilterEntity(e.target.value as AuditEntity | "all")
            }
            className="filter-select"
          >
            <option value="all">Todas as entidades</option>
            <option value="project">Projeto</option>
            <option value="component">Componente</option>
            <option value="commissioning_step">Etapa de Comissionamento</option>
            <option value="machine">Máquina</option>
            <option value="user">Usuário</option>
            <option value="report">Relatório</option>
            <option value="evidence">Evidência</option>
            <option value="approval">Aprovação</option>
          </select>
        </div>
      </div>

      <div className="audit-content">
        {filteredLogs.length === 0 ? (
          <div className="empty-state">
            <FiFileText className="empty-icon" />
            <h3>Nenhum log encontrado</h3>
            <p>Tente ajustar os filtros de busca</p>
          </div>
        ) : (
          <div className="audit-table-container">
            <table className="audit-table">
              <thead>
                <tr>
                  <th>Data/Hora</th>
                  <th>Ação</th>
                  <th>Entidade</th>
                  <th>Descrição</th>
                  <th>Usuário</th>
                  <th>Detalhes</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <div className="audit-date">
                        <FiCalendar className="date-icon" />
                        {log.timestamp.toLocaleString("pt-BR")}
                      </div>
                    </td>
                    <td>
                      <span className="audit-action">
                        {getActionIcon(log.action)} {getActionLabel(log.action)}
                      </span>
                    </td>
                    <td>
                      <span className="audit-entity">
                        {getEntityLabel(log.entity)}
                      </span>
                    </td>
                    <td>
                      <div className="audit-description">{log.description}</div>
                    </td>
                    <td>
                      <div className="audit-user">
                        <FiUser className="user-icon" />
                        {log.userName}
                      </div>
                    </td>
                    <td>
                      {log.changes && log.changes.length > 0 ? (
                        <details className="audit-details">
                          <summary>Ver mudanças</summary>
                          <div className="changes-list">
                            {log.changes.map((change, idx) => (
                              <div key={idx} className="change-item">
                                <strong>{change.field}:</strong>{" "}
                                <span className="old-value">
                                  {String(change.oldValue || "-")}
                                </span>{" "}
                                →{" "}
                                <span className="new-value">
                                  {String(change.newValue || "-")}
                                </span>
                              </div>
                            ))}
                          </div>
                        </details>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
