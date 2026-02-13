import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "../lib/firebaseconfig";
import type { Evidence } from "../types/commissioning";

export class EvidenceService {
  /**
   * Faz upload de uma evidência (foto, documento, etc.)
   */
  static async uploadEvidence(
    file: File,
    stepId: string,
    userId: string,
    type: "photo" | "document" | "video" | "signature"
  ): Promise<Evidence> {
    try {
      // Criar caminho único para o arquivo
      const timestamp = Date.now();
      const fileName = `${stepId}/${type}/${timestamp}_${file.name}`;
      const storageRef = ref(storage, `evidence/${fileName}`);

      // Upload do arquivo
      await uploadBytes(storageRef, file);

      // Obter URL de download
      const downloadURL = await getDownloadURL(storageRef);

      return {
        id: `${timestamp}-${Math.random()}`,
        type,
        url: downloadURL,
        fileName: file.name,
        uploadedAt: new Date(),
        uploadedBy: userId,
        description: file.name,
      };
    } catch (error) {
      console.error("Erro ao fazer upload de evidência:", error);
      throw new Error("Falha ao fazer upload do arquivo");
    }
  }

  /**
   * Remove uma evidência do storage
   */
  static async deleteEvidence(evidence: Evidence): Promise<void> {
    try {
      // Extrair o caminho do arquivo da URL
      const url = new URL(evidence.url);
      const path = decodeURIComponent(url.pathname.split("/o/")[1].split("?")[0]);
      const storageRef = ref(storage, path);

      await deleteObject(storageRef);
    } catch (error) {
      console.error("Erro ao deletar evidência:", error);
      // Não lançar erro para não interromper o fluxo
    }
  }

  /**
   * Valida o tipo e tamanho do arquivo
   */
  static validateFile(
    file: File,
    type: "photo" | "document" | "video" | "signature"
  ): { valid: boolean; error?: string } {
    const maxSizes: Record<string, number> = {
      photo: 10 * 1024 * 1024, // 10MB
      document: 20 * 1024 * 1024, // 20MB
      video: 100 * 1024 * 1024, // 100MB
      signature: 2 * 1024 * 1024, // 2MB
    };

    const allowedTypes: Record<string, string[]> = {
      photo: ["image/jpeg", "image/png", "image/jpg", "image/webp"],
      document: [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ],
      video: ["video/mp4", "video/quicktime", "video/x-msvideo"],
      signature: ["image/png", "image/jpeg", "image/jpg"],
    };

    if (file.size > maxSizes[type]) {
      return {
        valid: false,
        error: `Arquivo muito grande. Tamanho máximo: ${maxSizes[type] / 1024 / 1024}MB`,
      };
    }

    if (!allowedTypes[type].includes(file.type)) {
      return {
        valid: false,
        error: `Tipo de arquivo não permitido. Tipos aceitos: ${allowedTypes[type].join(", ")}`,
      };
    }

    return { valid: true };
  }
}
