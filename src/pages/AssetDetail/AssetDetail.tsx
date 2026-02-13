import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { AssetService } from "../../services/assetService";
import { ComponentService } from "../../services/componentService";
import type { Asset } from "../../types/assets";
import type { Component } from "../../types/components";
import { useAuth } from "../../hooks/useAuth";
import { paths } from "../../routes/paths";
import { FiArrowLeft, FiPlus, FiEdit3, FiTrash2 } from "react-icons/fi";
import { ComponentModal } from "./ComponentModal";
import "./AssetDetail.css";

export const AssetDetailPage: React.FC = () => {
  const { id: projectId, assetId } = useParams<{ id: string; assetId: string }>();
  const { user } = useAuth();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [components, setComponents] = useState<Component[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<Component | null | "new">(null);
  const [deleteComp, setDeleteComp] = useState<Component | null>(null);

  const load = () => {
    if (!assetId) return;
    setLoading(true);
    Promise.all([
      AssetService.getById(assetId),
      ComponentService.listByAsset(assetId),
    ])
      .then(([a, c]) => {
        setAsset(a ?? null);
        setComponents(c);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [assetId]);

  const handleSaveComponent = async (data: { name: string; description?: string }) => {
    if (!assetId || !user) return;
    if (modal && modal !== "new") {
      await ComponentService.update(modal.id, data);
    } else {
      await ComponentService.create({ assetId, ...data }, user.uid);
    }
    load();
    setModal(null);
  };

  const handleDeleteComponent = async () => {
    if (!deleteComp) return;
    await ComponentService.delete(deleteComp.id);
    load();
    setDeleteComp(null);
  };

  if (loading || !asset || !projectId) {
    return (
      <div className="asset-detail-page">
        <div className="loading-container"><div className="loading-spinner" /><p>Carregando...</p></div>
      </div>
    );
  }

  return (
    <div className="asset-detail-page">
      <div className="asset-detail-header">
        <Link to={paths.projectDetail(projectId!)} className="back-link">
          <FiArrowLeft /> Voltar ao projeto
        </Link>
        <h1>{asset.name}</h1>
        {asset.description && <p className="asset-desc">{asset.description}</p>}
      </div>

      <div className="components-section">
        <div className="section-header">
          <h2>Componentes</h2>
          <button type="button" className="btn-primary" onClick={() => setModal("new")}>
            <FiPlus /> Novo componente
          </button>
        </div>
        {components.length === 0 ? (
          <div className="empty-state">
            <p>Nenhum componente. Adicione um.</p>
            <button type="button" className="btn-primary" onClick={() => setModal("new")}>
              <FiPlus /> Novo componente
            </button>
          </div>
        ) : (
          <ul className="component-list">
            {components.map((c) => (
              <li key={c.id} className="component-item">
                <span className="comp-name">{c.name}</span>
                <span className="comp-desc">{c.description || "—"}</span>
                <div className="item-actions">
                  <button type="button" className="btn-icon" onClick={() => setModal(c)} title="Editar">
                    <FiEdit3 />
                  </button>
                  <button type="button" className="btn-icon btn-delete" onClick={() => setDeleteComp(c)} title="Excluir">
                    <FiTrash2 />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {modal && (
        <ComponentModal
          component={modal === "new" ? null : modal}
          onSave={handleSaveComponent}
          onClose={() => setModal(null)}
        />
      )}

      {deleteComp && (
        <div className="modal-overlay" onClick={() => setDeleteComp(null)}>
          <div className="modal-container delete-confirm" onClick={(e) => e.stopPropagation()}>
            <h3>Excluir componente?</h3>
            <p>Excluir &quot;{deleteComp.name}&quot;?</p>
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setDeleteComp(null)}>Cancelar</button>
              <button type="button" className="btn-primary" onClick={handleDeleteComponent}>Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
