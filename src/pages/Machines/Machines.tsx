import React, { useState, useEffect } from "react";
import type {
  Machine,
  Cluster,
  CreateMachineData,
  UpdateMachineData,
} from "../../types/machines";
import { MachineService } from "../../services/machineService";
import { useAuth } from "../../hooks/useAuth";
import { MachineModal } from "./MachineModal/MachineModal";
import { DeleteConfirmModal } from "./DeleteConfirmModal/DeleteConfirmModal";
import { Navigation } from "../../components/Navigation/Navigation";
import {
  FiPlus,
  FiEdit3,
  FiTrash2,
  FiSettings,
  FiAlertTriangle,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiCpu,
  FiLayers,
} from "react-icons/fi";
import "./Machines.css";

export const MachinesPage: React.FC = () => {
  const { user } = useAuth();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);
  const [deleteMachine, setDeleteMachine] = useState<Machine | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "machine" | "process">(
    "all"
  );
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "inactive" | "maintenance"
  >("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [machinesData, clustersData] = await Promise.all([
        MachineService.getMachines(),
        MachineService.getClusters(),
      ]);
      setMachines(machinesData);
      setClusters(clustersData);
    } catch (err) {
      setError("Erro ao carregar dados. Tente novamente.");
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMachine = async (data: CreateMachineData) => {
    if (!user) return;

    try {
      await MachineService.createMachine(data, user.uid);
      await loadData();
      setIsModalOpen(false);
    } catch (err) {
      setError("Erro ao criar máquina/processo. Tente novamente.");
      console.error("Error creating machine:", err);
    }
  };

  const handleUpdateMachine = async (data: UpdateMachineData) => {
    if (!user || !editingMachine) return;

    try {
      await MachineService.updateMachine(editingMachine.id, data, user.uid);
      await loadData();
      setEditingMachine(null);
      setIsModalOpen(false);
    } catch (err) {
      setError("Erro ao atualizar máquina/processo. Tente novamente.");
      console.error("Error updating machine:", err);
    }
  };

  const handleDeleteMachine = async () => {
    if (!deleteMachine) return;

    try {
      await MachineService.deleteMachine(deleteMachine.id);
      await loadData();
      setDeleteMachine(null);
    } catch (err) {
      setError("Erro ao excluir máquina/processo. Tente novamente.");
      console.error("Error deleting machine:", err);
    }
  };

  const handleEdit = (machine: Machine) => {
    setEditingMachine(machine);
    setIsModalOpen(true);
  };

  const handleDelete = (machine: Machine) => {
    setDeleteMachine(machine);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMachine(null);
  };

  const filteredMachines = machines.filter((machine) => {
    const matchesSearch =
      machine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      machine.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || machine.type === filterType;
    const matchesStatus =
      filterStatus === "all" || machine.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
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
      maintenance: {
        text: "Manutenção",
        className: "status-maintenance",
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

  const getTypeBadge = (type: string) => {
    const typeConfig = {
      machine: { text: "Máquina", className: "type-machine", icon: FiCpu },
      process: { text: "Processo", className: "type-process", icon: FiLayers },
    };

    const config =
      typeConfig[type as keyof typeof typeConfig] || typeConfig.machine;
    const IconComponent = config.icon;
    return (
      <span className={`type-badge ${config.className}`}>
        <IconComponent className="type-icon" />
        {config.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="machines-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Carregando máquinas e processos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="machines-page">
      <Navigation />
      <div className="machines-header">
        <div className="header-content">
          <h1>Gestão de Máquinas e Processos</h1>
          <p>Gerencie máquinas, processos e clusters do sistema</p>
        </div>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <FiPlus className="btn-icon" />
          Nova Máquina/Processo
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

      <div className="machines-filters">
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
            value={filterType}
            onChange={(e) =>
              setFilterType(e.target.value as "all" | "machine" | "process")
            }
            className="filter-select"
          >
            <option value="all">Todos os tipos</option>
            <option value="machine">Máquinas</option>
            <option value="process">Processos</option>
          </select>
        </div>

        <div className="filter-group">
          <select
            value={filterStatus}
            onChange={(e) =>
              setFilterStatus(
                e.target.value as "all" | "active" | "inactive" | "maintenance"
              )
            }
            className="filter-select"
          >
            <option value="all">Todos os status</option>
            <option value="active">Ativo</option>
            <option value="inactive">Inativo</option>
            <option value="maintenance">Manutenção</option>
          </select>
        </div>
      </div>

      <div className="machines-content">
        {filteredMachines.length === 0 ? (
          <div className="empty-state">
            <FiSettings className="empty-icon" />
            <h3>Nenhuma máquina/processo encontrado</h3>
            <p>
              {searchTerm || filterType !== "all" || filterStatus !== "all"
                ? "Tente ajustar os filtros de busca"
                : "Comece criando sua primeira máquina ou processo"}
            </p>
            {!searchTerm && filterType === "all" && filterStatus === "all" && (
              <button
                className="btn-primary"
                onClick={() => setIsModalOpen(true)}
              >
                <FiPlus className="btn-icon" />
                Criar primeira máquina/processo
              </button>
            )}
          </div>
        ) : (
          <div className="machines-table-container">
            <table className="machines-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Tipo</th>
                  <th>Status</th>
                  <th>Cluster</th>
                  <th>Descrição</th>
                  <th>Atualizado em</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredMachines.map((machine) => (
                  <tr key={machine.id}>
                    <td>
                      <div className="machine-name">
                        <strong>{machine.name}</strong>
                      </div>
                    </td>
                    <td>{getTypeBadge(machine.type)}</td>
                    <td>{getStatusBadge(machine.status)}</td>
                    <td>
                      {machine.clusterName ? (
                        <span className="cluster-name">
                          {machine.clusterName}
                        </span>
                      ) : (
                        <span className="no-cluster">Sem cluster</span>
                      )}
                    </td>
                    <td>
                      <div className="machine-description">
                        {machine.description || "-"}
                      </div>
                    </td>
                    <td>
                      <div className="machine-date">
                        {machine.updatedAt.toLocaleDateString("pt-BR")}
                      </div>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="btn-icon btn-edit"
                          onClick={() => handleEdit(machine)}
                          title="Editar"
                        >
                          <FiEdit3 />
                        </button>
                        <button
                          className="btn-icon btn-delete"
                          onClick={() => handleDelete(machine)}
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
        <MachineModal
          machine={editingMachine}
          clusters={clusters}
          onSave={
            editingMachine
              ? (data) => handleUpdateMachine(data as UpdateMachineData)
              : (data) => handleCreateMachine(data as CreateMachineData)
          }
          onClose={handleCloseModal}
        />
      )}

      {deleteMachine && (
        <DeleteConfirmModal
          title="Excluir Máquina/Processo"
          message={`Tem certeza que deseja excluir "${deleteMachine.name}"? Esta ação não pode ser desfeita.`}
          onConfirm={handleDeleteMachine}
          onCancel={() => setDeleteMachine(null)}
        />
      )}
    </div>
  );
};
