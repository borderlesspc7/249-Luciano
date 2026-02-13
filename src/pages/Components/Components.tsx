import React, { useState, useEffect } from "react";
import type {
  Component,
  CreateComponentData,
  UpdateComponentData,
} from "../../types/components";
import { ComponentService } from "../../services/componentService";
import { ProjectService } from "../../services/projectService";
import { MachineService } from "../../services/machineService";
import { useAuth } from "../../hooks/useAuth";
import { ComponentModal } from "./ComponentModal/ComponentModal";
import { DeleteConfirmModal } from "./DeleteConfirmModal/DeleteConfirmModal";
import type { Project } from "../../types/projects";
import type { Machine } from "../../types/machines";
import {
  FiPlus,
  FiEdit3,
  FiTrash2,
  FiPackage,
  FiAlertTriangle,
  FiCheckCircle,
  FiXCircle,
  FiClock,
} from "react-icons/fi";
import "./Components.css";

export const ComponentsPage: React.FC = () => {
  const { user } = useAuth();
  const [components, setComponents] = useState<Component[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<Component | null>(null);
  const [deleteComponent, setDeleteComponent] = useState<Component | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "pending" | "installed" | "tested" | "approved" | "rejected"
  >("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [componentsData, projectsData, machinesData] = await Promise.all([
        ComponentService.getComponents(),
        ProjectService.getProjects(),
        MachineService.getMachines(),
      ]);
      setComponents(componentsData);
      setProjects(projectsData);
      setMachines(machinesData);
    } catch (err) {
      setError("Erro ao carregar dados. Tente novamente.");
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateComponent = async (data: CreateComponentData) => {
    if (!user) return;

    try {
      await ComponentService.createComponent(data, user.uid);
      await loadData();
      setIsModalOpen(false);
    } catch (err) {
      setError("Erro ao criar componente. Tente novamente.");
      console.error("Error creating component:", err);
    }
  };

  const handleUpdateComponent = async (data: UpdateComponentData) => {
    if (!user || !editingComponent) return;

    try {
      await ComponentService.updateComponent(
        editingComponent.id,
        data,
        user.uid
      );
      await loadData();
      setEditingComponent(null);
      setIsModalOpen(false);
    } catch (err) {
      setError("Erro ao atualizar componente. Tente novamente.");
      console.error("Error updating component:", err);
    }
  };

  const handleDeleteComponent = async () => {
    if (!deleteComponent) return;

    try {
      await ComponentService.deleteComponent(deleteComponent.id);
      await loadData();
      setDeleteComponent(null);
    } catch (err) {
      setError("Erro ao excluir componente. Tente novamente.");
      console.error("Error deleting component:", err);
    }
  };

  const handleEdit = (component: Component) => {
    setEditingComponent(component);
    setIsModalOpen(true);
  };

  const handleDelete = (component: Component) => {
    setDeleteComponent(component);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingComponent(null);
  };

  const filteredComponents = components.filter((component) => {
    const matchesSearch =
      component.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      component.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      component.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || component.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: {
        text: "Pendente",
        className: "status-pending",
        icon: FiClock,
      },
      installed: {
        text: "Instalado",
        className: "status-installed",
        icon: FiCheckCircle,
      },
      tested: {
        text: "Testado",
        className: "status-tested",
        icon: FiCheckCircle,
      },
      approved: {
        text: "Aprovado",
        className: "status-approved",
        icon: FiCheckCircle,
      },
      rejected: {
        text: "Rejeitado",
        className: "status-rejected",
        icon: FiXCircle,
      },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] ||
      statusConfig.pending;
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
      <div className="components-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Carregando componentes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="components-page">
      <div className="components-header">
        <div className="header-content">
          <h1>Gestão de Componentes</h1>
          <p>Gerencie componentes da instalação</p>
        </div>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <FiPlus className="btn-icon" />
          Novo Componente
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

      <div className="components-filters">
        <div className="filter-group">
          <input
            type="text"
            placeholder="Buscar por nome, tipo ou serial..."
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
                  | "pending"
                  | "installed"
                  | "tested"
                  | "approved"
                  | "rejected"
              )
            }
            className="filter-select"
          >
            <option value="all">Todos os status</option>
            <option value="pending">Pendente</option>
            <option value="installed">Instalado</option>
            <option value="tested">Testado</option>
            <option value="approved">Aprovado</option>
            <option value="rejected">Rejeitado</option>
          </select>
        </div>
      </div>

      <div className="components-content">
        {filteredComponents.length === 0 ? (
          <div className="empty-state">
            <FiPackage className="empty-icon" />
            <h3>Nenhum componente encontrado</h3>
            <p>
              {searchTerm || filterStatus !== "all"
                ? "Tente ajustar os filtros de busca"
                : "Comece criando seu primeiro componente"}
            </p>
            {!searchTerm && filterStatus === "all" && (
              <button
                className="btn-primary"
                onClick={() => setIsModalOpen(true)}
              >
                <FiPlus className="btn-icon" />
                Criar primeiro componente
              </button>
            )}
          </div>
        ) : (
          <div className="components-table-container">
            <table className="components-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Tipo</th>
                  <th>Status</th>
                  <th>Projeto</th>
                  <th>Máquina</th>
                  <th>Serial</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredComponents.map((component) => (
                  <tr key={component.id}>
                    <td>
                      <div className="component-name">
                        <strong>{component.name}</strong>
                      </div>
                    </td>
                    <td>{component.type}</td>
                    <td>{getStatusBadge(component.status)}</td>
                    <td>
                      <span className="project-name">
                        {component.projectName || "-"}
                      </span>
                    </td>
                    <td>
                      <span className="machine-name">
                        {component.machineName || "-"}
                      </span>
                    </td>
                    <td>
                      <span className="serial-number">
                        {component.serialNumber || "-"}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="btn-icon btn-edit"
                          onClick={() => handleEdit(component)}
                          title="Editar"
                        >
                          <FiEdit3 />
                        </button>
                        <button
                          className="btn-icon btn-delete"
                          onClick={() => handleDelete(component)}
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
        <ComponentModal
          component={editingComponent}
          projects={projects}
          machines={machines}
          onSave={
            editingComponent
              ? (data) => handleUpdateComponent(data as UpdateComponentData)
              : (data) => handleCreateComponent(data as CreateComponentData)
          }
          onClose={handleCloseModal}
        />
      )}

      {deleteComponent && (
        <DeleteConfirmModal
          title="Excluir Componente"
          message={`Tem certeza que deseja excluir "${deleteComponent.name}"? Esta ação não pode ser desfeita.`}
          onConfirm={handleDeleteComponent}
          onCancel={() => setDeleteComponent(null)}
        />
      )}
    </div>
  );
};
