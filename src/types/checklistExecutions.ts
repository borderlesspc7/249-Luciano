export type ChecklistExecutionStatus = "draft" | "submitted" | "approved" | "rejected";

export interface AuditTrailEntry {
  userId: string;
  action: string;
  timestamp: Date;
  previousStatus?: ChecklistExecutionStatus;
  changedFields?: string[];
}

export interface ChecklistExecution {
  id: string;
  templateId: string;
  /** Versão do template no momento da criação da execução (auditoria). */
  templateVersion?: number;
  projectId: string;
  assetId?: string;
  stageId: string;
  status: ChecklistExecutionStatus;
  responses: Record<string, string | number | boolean>;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  submittedAt?: Date;
  approvedAt?: Date;
  auditTrail: AuditTrailEntry[];
}

export interface CreateChecklistExecutionData {
  templateId: string;
  templateVersion?: number;
  projectId: string;
  assetId?: string;
  stageId: string;
  createdBy: string;
}

export interface UpdateChecklistExecutionData {
  responses?: Record<string, string | number | boolean>;
  status?: ChecklistExecutionStatus;
}
