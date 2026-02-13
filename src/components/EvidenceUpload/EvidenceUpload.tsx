import React, { useState, useRef } from "react";
import { EvidenceService } from "../../services/evidenceService";
import type { Evidence } from "../../types/commissioning";
import { FiUpload, FiX, FiFile, FiImage, FiVideo, FiFileText } from "react-icons/fi";
import "./EvidenceUpload.css";

interface EvidenceUploadProps {
  stepId: string;
  userId: string;
  onUploadComplete: (evidence: Evidence) => void;
  onError?: (error: string) => void;
}

export const EvidenceUpload: React.FC<EvidenceUploadProps> = ({
  stepId,
  userId,
  onUploadComplete,
  onError,
}) => {
  const [uploading, setUploading] = useState(false);
  const [selectedType, setSelectedType] = useState<
    "photo" | "document" | "video" | "signature"
  >("photo");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar arquivo
    const validation = EvidenceService.validateFile(file, selectedType);
    if (!validation.valid) {
      onError?.(validation.error || "Arquivo inválido");
      return;
    }

    // Fazer upload
    try {
      setUploading(true);
      const evidence = await EvidenceService.uploadEvidence(
        file,
        stepId,
        userId,
        selectedType
      );
      onUploadComplete(evidence);
      
      // Limpar input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      onError?.("Erro ao fazer upload do arquivo");
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "photo":
        return <FiImage />;
      case "document":
        return <FiFileText />;
      case "video":
        return <FiVideo />;
      case "signature":
        return <FiFile />;
      default:
        return <FiFile />;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      photo: "Foto",
      document: "Documento",
      video: "Vídeo",
      signature: "Assinatura",
    };
    return labels[type] || type;
  };

  return (
    <div className="evidence-upload">
      <div className="upload-controls">
        <select
          value={selectedType}
          onChange={(e) =>
            setSelectedType(
              e.target.value as "photo" | "document" | "video" | "signature"
            )
          }
          className="type-select"
          disabled={uploading}
        >
          <option value="photo">Foto</option>
          <option value="document">Documento</option>
          <option value="video">Vídeo</option>
          <option value="signature">Assinatura</option>
        </select>

        <input
          ref={fileInputRef}
          type="file"
          accept={
            selectedType === "photo" || selectedType === "signature"
              ? "image/*"
              : selectedType === "document"
              ? ".pdf,.doc,.docx,.xls,.xlsx"
              : "video/*"
          }
          onChange={handleFileSelect}
          className="file-input"
          disabled={uploading}
          id={`evidence-upload-${stepId}`}
        />

        <label
          htmlFor={`evidence-upload-${stepId}`}
          className={`upload-button ${uploading ? "uploading" : ""}`}
        >
          {uploading ? (
            <>
              <div className="spinner-small"></div>
              Enviando...
            </>
          ) : (
            <>
              {getTypeIcon(selectedType)}
              Enviar {getTypeLabel(selectedType)}
            </>
          )}
        </label>
      </div>
    </div>
  );
};
