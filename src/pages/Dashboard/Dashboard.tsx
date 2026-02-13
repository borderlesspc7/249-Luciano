import React, { useState, useEffect, useCallback } from "react";
import { DashboardService } from "../../services/dashboardService";
import { StatCard } from "./StatCard/StatCard";
import { RecentActivities } from "./RecentActivities/RecentActivities";
import {
  FiSettings,
  FiCheckCircle,
  FiClock,
  FiAlertTriangle,
} from "react-icons/fi";
import "./Dashboard.css";
import type { DashboardStats } from "../../types/dashboard";

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const unsubscribe = DashboardService.subscribeToDashboardStats(
      (data) => {
        setStats(data);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Error in dashboard subscription:", err);
        setError("Erro ao carregar dados do dashboard. Tente novamente.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [retryKey]);

  const handleRetry = useCallback(() => {
    setRetryKey((k) => k + 1);
  }, []);

  if (loading && !stats) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
          <p>Visão geral do sistema</p>
        </div>

        <div className="dashboard-grid">
          {[...Array(6)].map((_, index) => (
            <StatCard
              key={index}
              title="Carregando..."
              value="..."
              description="..."
              icon={FiSettings}
              loading={true}
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-page">
        <div className="error-container">
          <FiAlertTriangle className="error-icon" />
          <h3>Erro ao carregar dashboard</h3>
          <p>{error}</p>
          <button onClick={handleRetry} className="retry-button">
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Dashboard</h1>
          <p>Visão geral do sistema de comissionamento</p>
        </div>
      </div>

      <div className="dashboard-grid">
        <StatCard
          title="Projetos Ativos"
          value={stats?.totalProjects || 0}
          description="Projetos em andamento"
          icon={FiSettings}
          color="primary"
        />

        <StatCard
          title="Máquinas Cadastradas"
          value={stats?.totalMachines || 0}
          description="Total de equipamentos"
          icon={FiSettings}
          color="info"
        />

        <StatCard
          title="Testes Concluídos"
          value={stats?.completedTests || 0}
          description={`${
            stats?.completionRate?.toFixed(1) || 0
          }% de conclusão`}
          icon={FiCheckCircle}
          color="success"
        />

        <StatCard
          title="Testes Pendentes"
          value={stats?.pendingTests || 0}
          description="Aguardando execução"
          icon={FiClock}
          color="warning"
        />

        <StatCard
          title="Testes Falharam"
          value={stats?.failedTests || 0}
          description="Requerem atenção"
          icon={FiAlertTriangle}
          color="danger"
        />

        <StatCard
          title="Em Atraso"
          value={stats?.overdueTests || 0}
          description="Fora do prazo"
          icon={FiAlertTriangle}
          color="danger"
        />
      </div>

      <div className="dashboard-content">
        <div className="content-grid">
          <div className="chart-container">
            <h3>Progresso dos Testes</h3>
            <div className="progress-chart">
              <div className="progress-circle">
                <div className="progress-value">
                  {stats?.completionRate?.toFixed(1) || 0}%
                </div>
                <div className="progress-label">Concluído</div>
              </div>
              <div className="progress-stats">
                <div className="progress-stat">
                  <span className="stat-label">Concluídos</span>
                  <span className="stat-value">
                    {stats?.completedTests || 0}
                  </span>
                </div>
                <div className="progress-stat">
                  <span className="stat-label">Pendentes</span>
                  <span className="stat-value">{stats?.pendingTests || 0}</span>
                </div>
                <div className="progress-stat">
                  <span className="stat-label">Falharam</span>
                  <span className="stat-value">{stats?.failedTests || 0}</span>
                </div>
              </div>
            </div>
          </div>

          <RecentActivities
            activities={stats?.recentActivity || []}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
};
