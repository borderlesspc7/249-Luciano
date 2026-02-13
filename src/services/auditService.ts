import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  where,
  Timestamp,
  limit,
} from "firebase/firestore";
import { db } from "../lib/firebaseconfig";
import type {
  AuditLog,
  AuditAction,
  AuditEntity,
  AuditChange,
  AuditFilter,
} from "../types/audit";

const AUDIT_COLLECTION = "audit_logs";

export class AuditService {
  /**
   * Registra uma ação de auditoria
   */
  static async logAction(
    action: AuditAction,
    entity: AuditEntity,
    entityId: string,
    userId: string,
    userName: string,
    description: string,
    options?: {
      entityName?: string;
      userEmail?: string;
      changes?: AuditChange[];
      metadata?: Record<string, any>;
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<void> {
    try {
      const auditData: any = {
        action,
        entity,
        entityId,
        userId,
        userName,
        description,
        timestamp: Timestamp.fromDate(new Date()),
      };

      if (options?.entityName) {
        auditData.entityName = options.entityName;
      }
      if (options?.userEmail) {
        auditData.userEmail = options.userEmail;
      }
      if (options?.changes && options.changes.length > 0) {
        auditData.changes = options.changes;
      }
      if (options?.metadata) {
        auditData.metadata = options.metadata;
      }
      if (options?.ipAddress) {
        auditData.ipAddress = options.ipAddress;
      }
      if (options?.userAgent) {
        auditData.userAgent = options.userAgent;
      }

      await addDoc(collection(db, AUDIT_COLLECTION), auditData);
    } catch (error) {
      // Não lançar erro para não interromper o fluxo principal
      // Apenas logar no console
      console.error("Erro ao registrar auditoria:", error);
    }
  }

  /**
   * Obtém logs de auditoria com filtros opcionais
   */
  static async getAuditLogs(
    filter?: AuditFilter,
    maxResults: number = 100
  ): Promise<AuditLog[]> {
    try {
      let q = query(
        collection(db, AUDIT_COLLECTION),
        orderBy("timestamp", "desc"),
        limit(maxResults)
      );

      if (filter?.action) {
        q = query(q, where("action", "==", filter.action));
      }
      if (filter?.entity) {
        q = query(q, where("entity", "==", filter.entity));
      }
      if (filter?.userId) {
        q = query(q, where("userId", "==", filter.userId));
      }
      if (filter?.startDate) {
        q = query(
          q,
          where("timestamp", ">=", Timestamp.fromDate(filter.startDate))
        );
      }
      if (filter?.endDate) {
        q = query(
          q,
          where("timestamp", "<=", Timestamp.fromDate(filter.endDate))
        );
      }

      const querySnapshot = await getDocs(q);
      const logs: AuditLog[] = [];

      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        logs.push({
          id: docSnapshot.id,
          action: data.action,
          entity: data.entity,
          entityId: data.entityId,
          entityName: data.entityName,
          userId: data.userId,
          userName: data.userName,
          userEmail: data.userEmail,
          timestamp: data.timestamp?.toDate() || new Date(),
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          changes: data.changes || [],
          metadata: data.metadata || {},
          description: data.description || "",
        });
      });

      // Aplicar filtro de busca no cliente se necessário
      if (filter?.searchTerm) {
        const searchLower = filter.searchTerm.toLowerCase();
        return logs.filter(
          (log) =>
            log.description.toLowerCase().includes(searchLower) ||
            log.userName.toLowerCase().includes(searchLower) ||
            log.entityName?.toLowerCase().includes(searchLower) ||
            log.entityId.toLowerCase().includes(searchLower)
        );
      }

      return logs;
    } catch (error) {
      console.error("Erro ao buscar logs de auditoria:", error);
      throw error;
    }
  }

  /**
   * Obtém histórico de mudanças de uma entidade específica
   */
  static async getEntityHistory(
    entity: AuditEntity,
    entityId: string
  ): Promise<AuditLog[]> {
    return this.getAuditLogs({
      entity,
      // Filtrar por entityId no cliente já que Firestore não suporta múltiplos where com diferentes campos facilmente
    }).then((logs) => logs.filter((log) => log.entityId === entityId));
  }

  /**
   * Obtém ações de um usuário específico
   */
  static async getUserActions(userId: string): Promise<AuditLog[]> {
    return this.getAuditLogs({ userId });
  }

  /**
   * Obtém IP address do cliente (para uso em auditoria)
   */
  static async getClientIP(): Promise<string | undefined> {
    try {
      const response = await fetch("https://api.ipify.org?format=json");
      const data = await response.json();
      return data.ip;
    } catch {
      return undefined;
    }
  }

  /**
   * Obtém user agent do navegador
   */
  static getUserAgent(): string | undefined {
    if (typeof window !== "undefined") {
      return window.navigator.userAgent;
    }
    return undefined;
  }
}
