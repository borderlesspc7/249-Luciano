import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ProjectService } from "../../services/projectService";
import { AssetService } from "../../services/assetService";
import { StageService } from "../../services/stageService";
import type { Project } from "../../types/projects";
import type { Asset } from "../../types/assets";
import type { Stage } from "../../types/stages";
import { useAuth } from "../../hooks/useAuth";
import { paths } from "../../routes/paths";
import { FiArrowLeft, FiPackage, FiList, FiPlus, FiEdit3, FiTrash2 } from "react-icons/fi";
import { AssetModal } from "./AssetModal";
import { StageModal } from "./StageModal";
import "./ProjectDetail.css";

type Tab = "assets" | "stages";

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [tab, setTab] = useState<Tab>("assets");
  const [loading, setLoading] = useState(true);
  const [assetModal, setAssetModal] = useState<Asset | null | "new">(null);
  const [stageModal, setStageModal] = useState<Stage | null | "new">(null);
  const [deleteAsset, setDeleteAsset] = useState<Asset | null>(null);
  const [deleteStage, setDeleteStage] = useState<Stage | null>(null);

  const load = () => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      ProjectService.getById(id),
      AssetService.listByProject(id),
      StageService.listByProject(id),
    ])
      .then(([p, a, s]) => {
        setProject(p ?? null);
        setAssets(a);
        setStages(s);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleSaveAsset = async (data: { name: string; description?: string; type?: string }) => {
    if (!id || !user) return;
    if (assetModal && assetModal !== "new") {
      await AssetService.update(assetModal.id, data);
    } else {
      await AssetService.create({ projectId: id, ...data }, user.uid);
    }
    load();
    setAssetModal(null);
  };

  const handleSaveStage = async (data: { name: string; type: Stage["type"]; order: number }) => {
    if (!id || !user) return;
    if (stageModal && stageModal !== "new") {
      await StageService.update(stageModal.id, data);
    } else {
      await StageService.create({ projectId: id, ...data }, user.uid);
    }
    load();
    setStageModal(null);
  };

  const handleDeleteAsset = async () => {
    if (!deleteAsset) return;
    await AssetService.delete(deleteAsset.id);
    load();
    setDeleteAsset(null);
  };

  const handleDeleteStage = async () => {
    if (!deleteStage) return;
    await StageService.delete(deleteStage.id);
    load();
    setDeleteStage(null);
  };

  if (loading || !project) {
    return (
      <div className="project-detail-page">
        <div className="loading-container">
          <div className="loading-spinner" />
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="project-detail-page">
      <div className="project-detail-header">
        <Link to={paths.projects} className="back-link">
          <FiArrowLeft /> Projetos
        </Link>
        <h1>{project.name}</h1>
        {project.description && <p className="project-desc">{project.description}</p>}
      </div>

      <div className="tabs">
        <button
          type="button"
          className={`tab ${tab === "assets" ? "active" : ""}`}
          onClick={() => setTab("assets")}
        >
          <FiPackage /> Equipamentos ({assets.length})
        </button>
        <button
          type="button"
          className={`tab ${tab === "stages" ? "active" : ""}`}
          onClick={() => setTab("stages")}
        >
          <FiList /> Etapas ({stages.length})
        </button>
      </div>

      {tab === "assets" && (
        <div className="tab-content">
          <div className="tab-header">
            <h2>Equipamentos</h2>
            <button type="button" className="btn-primary" onClick={() => setAssetModal("new")}>
              <FiPlus /> Novo equipamento
            </button>
          </div>
          {assets.length === 0 ? (
            <div className="empty-state">
              <p>Nenhum equipamento. Adicione um para começar.</p>
              <button type="button" className="btn-primary" onClick={() => setAssetModal("new")}>
                <FiPlus /> Novo equipamento
              </button>
            </div>
          ) : (
            <ul className="asset-list">
              {assets.map((a) => (
                <li key={a.id} className="asset-item">
                  <Link to={paths.projectAssetDetail(id!, a.id)} className="asset-name">
                    {a.name}
                  </Link>
                  <span className="asset-meta">{a.type || "—"}</span>
                  <div className="item-actions">
                    <button type="button" className="btn-icon" onClick={() => setAssetModal(a)} title="Editar">
                      <FiEdit3 />
                    </button>
                    <button type="button" className="btn-icon btn-delete" onClick={() => setDeleteAsset(a)} title="Excluir">
                      <FiTrash2 />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === "stages" && (
        <div className="tab-content">
          <div className="tab-header">
            <h2>Etapas</h2>
            <button type="button" className="btn-primary" onClick={() => setStageModal("new")}>
              <FiPlus /> Nova etapa
            </button>
          </div>
          {stages.length === 0 ? (
            <div className="empty-state">
              <p>Nenhuma etapa. Adicione etapas de comissionamento (visual, funcional, performance).</p>
              <button type="button" className="btn-primary" onClick={() => setStageModal("new")}>
                <FiPlus /> Nova etapa
              </button>
            </div>
          ) : (
            <ul className="stage-list">
              {stages.map((s, idx) => (
                <li key={s.id} className="stage-item">
                  <span className="stage-order">{idx + 1}</span>
                  <span className="stage-name">{s.name}</span>
                  <span className="stage-type">{s.type}</span>
                  <Link
                    to={paths.projectStageChecklist(id!, s.id)()}
                    className="link-checklist"
                  >
                    Checklist
                  </Link>
                  <div className="item-actions">
                    <button type="button" className="btn-icon" onClick={() => setStageModal(s)} title="Editar">
                      <FiEdit3 />
                    </button>
                    <button type="button" className="btn-icon btn-delete" onClick={() => setDeleteStage(s)} title="Excluir">
                      <FiTrash2 />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {assetModal && (
        <AssetModal
          projectId={id!}
          asset={assetModal === "new" ? null : assetModal}
          onSave={handleSaveAsset}
          onClose={() => setAssetModal(null)}
        />
      )}

      {stageModal && (
        <StageModal
          projectId={id!}
          stage={stageModal === "new" ? null : stageModal}
          existingOrder={stages.length}
          onSave={handleSaveStage}
          onClose={() => setStageModal(null)}
        />
      )}

      {deleteAsset && (
        <div className="modal-overlay" onClick={() => setDeleteAsset(null)}>
          <div className="modal-container delete-confirm" onClick={(e) => e.stopPropagation()}>
            <h3>Excluir equipamento?</h3>
            <p>Excluir &quot;{deleteAsset.name}&quot;? Esta ação não pode ser desfeita.</p>
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setDeleteAsset(null)}>Cancelar</button>
              <button type="button" className="btn-primary" onClick={handleDeleteAsset}>Excluir</button>
            </div>
          </div>
        </div>
      )}

      {deleteStage && (
        <div className="modal-overlay" onClick={() => setDeleteStage(null)}>
          <div className="modal-container delete-confirm" onClick={(e) => e.stopPropagation()}>
            <h3>Excluir etapa?</h3>
            <p>Excluir &quot;{deleteStage.name}&quot;?</p>
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setDeleteStage(null)}>Cancelar</button>
              <button type="button" className="btn-primary" onClick={handleDeleteStage}>Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
