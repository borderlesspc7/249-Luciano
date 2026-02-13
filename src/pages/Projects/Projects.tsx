import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import type { Project, CreateProjectData, UpdateProjectData } from "../../types/projects";
import { ProjectService } from "../../services/projectService";
import { useAuth } from "../../hooks/useAuth";
import { ProjectModal } from "./ProjectModal";
import { paths } from "../../routes/paths";
import { FiPlus, FiEdit3, FiTrash2, FiFolder, FiAlertTriangle, FiCheckCircle, FiClock } from "react-icons/fi";
import "./Projects.css";

const PAGE_SIZE = 10;

export const ProjectsPage: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState<Project | null>(null);
  const [page, setPage] = useState(0);

  const load = () => {
    setLoading(true);
    setError(null);
    ProjectService.list()
      .then(setProjects)
      .catch(() => setError("Erro ao carregar projetos."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async (data: CreateProjectData | UpdateProjectData) => {
    if (!user) return;
    if (editing) {
      await ProjectService.update(editing.id, { name: data.name, description: data.description, status: data.status }, user.uid);
    } else {
      await ProjectService.create(
        { name: (data as CreateProjectData).name, description: data.description, status: data.status ?? "active" },
        user.uid
      );
    }
    load();
    setModalOpen(false);
    setEditing(null);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    await ProjectService.delete(deleting.id);
    load();
    setDeleting(null);
  };

  const paginated = projects.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const totalPages = Math.ceil(projects.length / PAGE_SIZE) || 1;
  const isAdmin = user?.role === "admin";

  if (loading) {
    return (
      <div className="projects-page">
        <div className="loading-container">
          <div className="loading-spinner" />
          <p>Carregando projetos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="projects-page">
      <div className="projects-header">
        <div className="header-content">
          <h1>Projetos</h1>
          <p>Gerencie projetos de comissionamento</p>
        </div>
        <button type="button" className="btn-primary" onClick={() => { setEditing(null); setModalOpen(true); }}>
          <FiPlus className="btn-icon" />
          Novo projeto
        </button>
      </div>

      {error && (
        <div className="error-message">
          <FiAlertTriangle className="error-icon" />
          {error}
        </div>
      )}

      <div className="projects-content">
        {projects.length === 0 ? (
          <div className="empty-state">
            <FiFolder className="empty-icon" />
            <h3>Nenhum projeto</h3>
            <p>Crie o primeiro projeto para começar.</p>
            <button type="button" className="btn-primary" onClick={() => setModalOpen(true)}>
              <FiPlus className="btn-icon" />
              Novo projeto
            </button>
          </div>
        ) : (
          <>
            <div className="projects-table-container">
              <table className="projects-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Status</th>
                    <th>Descrição</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <Link to={paths.projectDetail(p.id)} className="project-name-link">
                          {p.name}
                        </Link>
                      </td>
                      <td>
                        <span className={`status-badge status-${p.status}`}>
                          {p.status === "active" && <><FiCheckCircle /> Ativo</>}
                          {p.status === "completed" && <><FiCheckCircle /> Concluído</>}
                          {p.status === "on_hold" && <><FiClock /> Pausado</>}
                        </span>
                      </td>
                      <td className="project-desc">{p.description || "—"}</td>
                      <td>
                        <div className="table-actions">
                          <Link to={paths.projectDetail(p.id)} className="btn-icon btn-edit" title="Abrir">
                            <FiEdit3 />
                          </Link>
                          {isAdmin && (
                            <button
                              type="button"
                              className="btn-icon btn-delete"
                              title="Excluir"
                              onClick={() => setDeleting(p)}
                            >
                              <FiTrash2 />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Anterior
                </button>
                <span className="pagination-info">
                  Página {page + 1} de {totalPages}
                </span>
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Próxima
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {modalOpen && (
        <ProjectModal
          project={editing}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditing(null); }}
        />
      )}

      {deleting && (
        <div className="modal-overlay" onClick={() => setDeleting(null)}>
          <div className="modal-container delete-confirm" onClick={(e) => e.stopPropagation()}>
            <h3>Excluir projeto?</h3>
            <p>Tem certeza que deseja excluir &quot;{deleting.name}&quot;? Esta ação não pode ser desfeita.</p>
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setDeleting(null)}>
                Cancelar
              </button>
              <button type="button" className="btn-primary" onClick={handleDelete}>
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
