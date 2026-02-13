import { AuditService } from "../services/auditService";
import type { AuditAction, AuditEntity, AuditChange } from "../types/audit";
import type { User } from "../types/users";

/**
 * Helper para registrar ações de auditoria
 */
export async function logAuditAction(
  action: AuditAction,
  entity: AuditEntity,
  entityId: string,
  user: User,
  description: string,
  options?: {
    entityName?: string;
    changes?: AuditChange[];
    metadata?: Record<string, any>;
  }
): Promise<void> {
  try {
    const ipAddress = await AuditService.getClientIP();
    const userAgent = AuditService.getUserAgent();

    await AuditService.logAction(
      action,
      entity,
      entityId,
      user.uid,
      user.name || "Usuário",
      description,
      {
        entityName: options?.entityName,
        userEmail: user.email,
        changes: options?.changes,
        metadata: options?.metadata,
        ipAddress,
        userAgent,
      }
    );
  } catch (error) {
    // Não interromper o fluxo principal se a auditoria falhar
    console.error("Erro ao registrar auditoria:", error);
  }
}

/**
 * Cria um array de mudanças comparando objetos antigo e novo
 */
export function createAuditChanges(
  oldData: Record<string, any>,
  newData: Record<string, any>
): AuditChange[] {
  const changes: AuditChange[] = [];

  // Comparar campos do novo objeto
  Object.keys(newData).forEach((key) => {
    if (oldData[key] !== newData[key]) {
      changes.push({
        field: key,
        oldValue: oldData[key],
        newValue: newData[key],
      });
    }
  });

  // Verificar campos removidos
  Object.keys(oldData).forEach((key) => {
    if (!(key in newData) && oldData[key] !== undefined) {
      changes.push({
        field: key,
        oldValue: oldData[key],
        newValue: undefined,
      });
    }
  });

  return changes;
}
