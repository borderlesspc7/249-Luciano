import React, { useState, useEffect } from "react";
import type {
  Project,
  CreateProjectData,
  UpdateProjectData,
} from "../../types/projects";
import { ProjectService } from "../../services/projectService";
import { UserService } from "../../services/userService";
import { useAuth } from "../../hooks/useAuth";
import { ProjectModal } from "./ProjectModal/ProjectModal";
import { DeleteConfirmModal } from "./DeleteConfirmModal/DeleteConfirmModal";
import type { UserManagement } from "../../types/userManagement";
import {
  FiPlus,
  FiEdit3,
  FiTrash2,
  FiFolder,
  FiAlertTriangle,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiCalendar,
  FiDownload,
} from "react-icons/fi";
import { PDFService } from "../../services/pdfService";
import { ComponentService } from "../../services/componentService";
import { CommissioningService } from "../../services/commissioningService";
import "./Projects.css";

export const ProjectsPage: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<UserManagement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deleteProject, setDeleteProject] = useState<Project | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "completed" | "overdue" | "cancelled"
  >("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [projectsData, usersData] = await Promise.all([
        ProjectService.getProjects(),
        UserService.getUsers(),
      ]);
      setProjects(projectsData);
      setUsers(usersData);
    } catch (err) {
      setError("Erro ao carregar dados. Tente novamente.");
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (data: CreateProjectData) => {
    if (!user) return;

    try {
      await ProjectService.createProject(data, user.uid);
      await loadData();
      setIsModalOpen(false);
    } catch (err) {
      setError("Erro ao criar projeto. Tente novamente.");
      console.error("Error creating project:", err);
    }
  };

  const handleUpdateProject = async (data: UpdateProjectData) => {
    if (!user || !editingProject) return;

    try {
      await ProjectService.updateProject(editingProject.id, data, user.uid);
      await loadData();
      setEditingProject(null);
      setIsModalOpen(false);
    } catch (err) {
      setError("Erro ao atualizar projeto. Tente novamente.");
      console.error("Error updating project:", err);
    }
  };

  const handleDeleteProject = async () => {
    if (!deleteProject) return;

    try {
      await ProjectService.deleteProject(deleteProject.id);
      await loadData();
      setDeleteProject(null);
    } catch (err) {
      setError("Erro ao excluir projeto. Tente novamente.");
      console.error("Error deleting project:", err);
    }
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setIsModalOpen(true);
  };

  const handleDelete = (project: Project) => {
    setDeleteProject(project);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProject(null);
  };

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || project.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: {
        text: "Ativo",
        className: "status-active",
        icon: FiCheckCircle,
      },
      completed: {
        text: "Concluído",
        className: "status-completed",
        icon: FiCheckCircle,
      },
      overdue: {
        text: "Em Atraso",
        className: "status-overdue",
        icon: FiAlertTriangle,
      },
      cancelled: {
        text: "Cancelado",
        className: "status-cancelled",
        icon: FiXCircle,
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

  if (loading) {
    return (
      <div className="projects-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Carregando projetos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="projects-page">
      <div className="projects-header">
        <div className="header-content">
          <h1>Gestão de Projetos</h1>
          <p>Gerencie projetos de comissionamento e validação</p>
        </div>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <FiPlus className="btn-icon" />
          Novo Projeto
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

      <div className="projects-filters">
        <div className="filter-group">
          <input
            type="text"
            placeholder="Buscar por nome ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-group">
          <select
            value={filterStatus}
            onChange={(e) =>
              setFilterStatus(
                e.target.value as
                  | "all"
                  | "active"
                  | "completed"
                  | "overdue"
                  | "cancelled"
              )
            }
            className="filter-select"
          >
            <option value="all">Todos os status</option>
            <option value="active">Ativo</option>
            <option value="completed">Concluído</option>
            <option value="overdue">Em Atraso</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </div>
      </div>

      <div className="projects-content">
        {filteredProjects.length === 0 ? (
          <div className="empty-state">
            <FiFolder className="empty-icon" />
            <h3>Nenhum projeto encontrado</h3>
            <p>
              {searchTerm || filterStatus !== "all"
                ? "Tente ajustar os filtros de busca"
                : "Comece criando seu primeiro projeto"}
            </p>
            {!searchTerm && filterStatus === "all" && (
              <button
                className="btn-primary"
                onClick={() => setIsModalOpen(true)}
              >
                <FiPlus className="btn-icon" />
                Criar primeiro projeto
              </button>
            )}
          </div>
        ) : (
          <div className="projects-table-container">
            <table className="projects-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Status</th>
                  <th>Data Início</th>
                  <th>Data Prevista</th>
                  <th>Gerente</th>
                  <th>Descrição</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((project) => (
                  <tr key={project.id}>
                    <td>
                      <div className="project-name">
                        <strong>{project.name}</strong>
                      </div>
                    </td>
                    <td>{getStatusBadge(project.status)}</td>
                    <td>
                      <div className="project-date">
                        <FiCalendar className="date-icon" />
                        {project.startDate.toLocaleDateString("pt-BR")}
                      </div>
                    </td>
                    <td>
                      <div className="project-date">
                        {project.expectedEndDate ? (
                          <>
                            <FiCalendar className="date-icon" />
                            {project.expectedEndDate.toLocaleDateString("pt-BR")}
                          </>
                        ) : (
                          "-"
                        )}
                      </div>
                    </td>
                    <td>
                      {project.managerName ? (
                        <span className="manager-name">
                          {project.managerName}
                        </span>
                      ) : (
                        <span className="no-manager">Sem gerente</span>
                      )}
                    </td>
                    <td>
                      <div className="project-description">
                        {project.description || "-"}
                      </div>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="btn-icon btn-download"
                          onClick={async () => {
                            try {
                              const [components, steps] = await Promise.all([
                                ComponentService.getComponentsByProject(project.id),
                                CommissioningService.getStepsByProject(project.id),
                              ]);
                              const manager = project.managerId
                                ? users.find((u) => u.id === project.managerId)
                                : undefined;
                              const blob = await PDFService.generateProjectValidationReport(
                                project,
                                components,
                                steps,
                                manager
                              );
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = `Relatorio_${project.name.replace(/\s+/g, "_")}.pdf`;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              URL.revokeObjectURL(url);
                            } catch (error) {
                              setError("Erro ao gerar relatório PDF");
                              console.error("Error generating PDF:", error);
                            }
                          }}
                          title="Gerar Relatório PDF"
                        >
                          <FiDownload />
                        </button>
                        <button
                          className="btn-icon btn-edit"
                          onClick={() => handleEdit(project)}
                          title="Editar"
                        >
                          <FiEdit3 />
                        </button>
                        <button
                          className="btn-icon btn-delete"
                          onClick={() => handleDelete(project)}
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
        <ProjectModal
          project={editingProject}
          users={users}
          onSave={
            editingProject
              ? (data) => handleUpdateProject(data as UpdateProjectData)
              : (data) => handleCreateProject(data as CreateProjectData)
          }
          onClose={handleCloseModal}
        />
      )}

      {deleteProject && (
        <DeleteConfirmModal
          title="Excluir Projeto"
          message={`Tem certeza que deseja excluir "${deleteProject.name}"? Esta ação não pode ser desfeita.`}
          onConfirm={handleDeleteProject}
          onCancel={() => setDeleteProject(null)}
        />
      )}
    </div>
  );
};
