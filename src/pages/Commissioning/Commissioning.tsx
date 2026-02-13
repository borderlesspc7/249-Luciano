import React, { useState, useEffect } from "react";
import type {
  CommissioningStep,
  CreateCommissioningStepData,
  UpdateCommissioningStepData,
} from "../../types/commissioning";
import { CommissioningService } from "../../services/commissioningService";
import { ProjectService } from "../../services/projectService";
import { ComponentService } from "../../services/componentService";
import { MachineService } from "../../services/machineService";
import { UserService } from "../../services/userService";
import { useAuth } from "../../hooks/useAuth";
import { StepModal } from "./StepModal/StepModal";
import { DeleteConfirmModal } from "./DeleteConfirmModal/DeleteConfirmModal";
import type { Project } from "../../types/projects";
import type { Component } from "../../types/components";
import type { Machine } from "../../types/machines";
import type { UserManagement } from "../../types/userManagement";
import {
  FiPlus,
  FiEdit3,
  FiTrash2,
  FiCheckSquare,
  FiAlertTriangle,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiPlay,
} from "react-icons/fi";
import "./Commissioning.css";

export const CommissioningPage: React.FC = () => {
  const { user } = useAuth();
  const [steps, setSteps] = useState<CommissioningStep[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [components, setComponents] = useState<Component[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [users, setUsers] = useState<UserManagement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<CommissioningStep | null>(null);
  const [deleteStep, setDeleteStep] = useState<CommissioningStep | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "pending" | "in_progress" | "completed" | "failed" | "skipped"
  >("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [
        stepsData,
        projectsData,
        componentsData,
        machinesData,
        usersData,
      ] = await Promise.all([
        CommissioningService.getSteps(),
        ProjectService.getProjects(),
        ComponentService.getComponents(),
        MachineService.getMachines(),
        UserService.getUsers(),
      ]);
      setSteps(stepsData);
      setProjects(projectsData);
      setComponents(componentsData);
      setMachines(machinesData);
      setUsers(usersData);
    } catch (err) {
      setError("Erro ao carregar dados. Tente novamente.");
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStep = async (data: CreateCommissioningStepData) => {
    if (!user) return;

    try {
      await CommissioningService.createStep(data, user.uid);
      await loadData();
      setIsModalOpen(false);
    } catch (err) {
      setError("Erro ao criar etapa. Tente novamente.");
      console.error("Error creating step:", err);
    }
  };

  const handleUpdateStep = async (data: UpdateCommissioningStepData) => {
    if (!user || !editingStep) return;

    try {
      await CommissioningService.updateStep(editingStep.id, data, user.uid);
      await loadData();
      setEditingStep(null);
      setIsModalOpen(false);
    } catch (err) {
      setError("Erro ao atualizar etapa. Tente novamente.");
      console.error("Error updating step:", err);
    }
  };

  const handleDeleteStep = async () => {
    if (!deleteStep) return;

    try {
      await CommissioningService.deleteStep(deleteStep.id);
      await loadData();
      setDeleteStep(null);
    } catch (err) {
      setError("Erro ao excluir etapa. Tente novamente.");
      console.error("Error deleting step:", err);
    }
  };

  const handleEdit = (step: CommissioningStep) => {
    setEditingStep(step);
    setIsModalOpen(true);
  };

  const handleDelete = (step: CommissioningStep) => {
    setDeleteStep(step);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingStep(null);
  };

  const filteredSteps = steps.filter((step) => {
    const matchesSearch =
      step.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      step.projectName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || step.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: {
        text: "Pendente",
        className: "status-pending",
        icon: FiClock,
      },
      in_progress: {
        text: "Em Andamento",
        className: "status-in-progress",
        icon: FiPlay,
      },
      completed: {
        text: "Concluída",
        className: "status-completed",
        icon: FiCheckCircle,
      },
      failed: {
        text: "Falhou",
        className: "status-failed",
        icon: FiXCircle,
      },
      skipped: {
        text: "Pulada",
        className: "status-skipped",
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

  const getTypeLabel = (type: string) => {
    const typeLabels: Record<string, string> = {
      visual_inspection: "Inspeção Visual",
      functional_test: "Teste Funcional",
      performance_test: "Teste de Performance",
      safety_test: "Teste de Segurança",
      documentation: "Documentação",
      approval: "Aprovação",
    };
    return typeLabels[type] || type;
  };

  if (loading) {
    return (
      <div className="commissioning-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Carregando etapas de comissionamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="commissioning-page">
      <div className="commissioning-header">
        <div className="header-content">
          <h1>Etapas de Comissionamento</h1>
          <p>Gerencie etapas do processo de comissionamento</p>
        </div>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <FiPlus className="btn-icon" />
          Nova Etapa
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

      <div className="commissioning-filters">
        <div className="filter-group">
          <input
            type="text"
            placeholder="Buscar por nome ou projeto..."
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
                  | "in_progress"
                  | "completed"
                  | "failed"
                  | "skipped"
              )
            }
            className="filter-select"
          >
            <option value="all">Todos os status</option>
            <option value="pending">Pendente</option>
            <option value="in_progress">Em Andamento</option>
            <option value="completed">Concluída</option>
            <option value="failed">Falhou</option>
            <option value="skipped">Pulada</option>
          </select>
        </div>
      </div>

      <div className="commissioning-content">
        {filteredSteps.length === 0 ? (
          <div className="empty-state">
            <FiCheckSquare className="empty-icon" />
            <h3>Nenhuma etapa encontrada</h3>
            <p>
              {searchTerm || filterStatus !== "all"
                ? "Tente ajustar os filtros de busca"
                : "Comece criando sua primeira etapa de comissionamento"}
            </p>
            {!searchTerm && filterStatus === "all" && (
              <button
                className="btn-primary"
                onClick={() => setIsModalOpen(true)}
              >
                <FiPlus className="btn-icon" />
                Criar primeira etapa
              </button>
            )}
          </div>
        ) : (
          <div className="commissioning-table-container">
            <table className="commissioning-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Tipo</th>
                  <th>Status</th>
                  <th>Projeto</th>
                  <th>Componente/Máquina</th>
                  <th>Responsável</th>
                  <th>Prazo</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredSteps.map((step) => (
                  <tr key={step.id}>
                    <td>
                      <div className="step-name">
                        <strong>{step.name}</strong>
                      </div>
                    </td>
                    <td>{getTypeLabel(step.type)}</td>
                    <td>{getStatusBadge(step.status)}</td>
                    <td>
                      <span className="project-name">
                        {step.projectName || "-"}
                      </span>
                    </td>
                    <td>
                      <span>
                        {step.componentName || step.machineName || "-"}
                      </span>
                    </td>
                    <td>
                      <span className="assigned-to">
                        {step.assignedToName || "-"}
                      </span>
                    </td>
                    <td>
                      {step.dueDate ? (
                        <span className="due-date">
                          {step.dueDate.toLocaleDateString("pt-BR")}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="btn-icon btn-edit"
                          onClick={() => handleEdit(step)}
                          title="Editar"
                        >
                          <FiEdit3 />
                        </button>
                        <button
                          className="btn-icon btn-delete"
                          onClick={() => handleDelete(step)}
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
        <StepModal
          step={editingStep}
          projects={projects}
          components={components}
          machines={machines}
          users={users}
          onSave={
            editingStep
              ? (data) => handleUpdateStep(data as UpdateCommissioningStepData)
              : (data) => handleCreateStep(data as CreateCommissioningStepData)
          }
          onClose={handleCloseModal}
        />
      )}

      {deleteStep && (
        <DeleteConfirmModal
          title="Excluir Etapa"
          message={`Tem certeza que deseja excluir "${deleteStep.name}"? Esta ação não pode ser desfeita.`}
          onConfirm={handleDeleteStep}
          onCancel={() => setDeleteStep(null)}
        />
      )}
    </div>
  );
};
