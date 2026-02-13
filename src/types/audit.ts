export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "view"
  | "approve"
  | "reject"
  | "login"
  | "logout"
  | "export"
  | "upload"
  | "download";

export type AuditEntity =
  | "project"
  | "component"
  | "commissioning_step"
  | "machine"
  | "user"
  | "report"
  | "evidence"
  | "approval";

export interface AuditLog {
  id: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId: string;
  entityName?: string;
  userId: string;
  userName: string;
  userEmail?: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  changes?: AuditChange[];
  metadata?: Record<string, any>;
  description: string;
}

export interface AuditChange {
  field: string;
  oldValue: any;
  newValue: any;
}

export interface AuditFilter {
  action?: AuditAction;
  entity?: AuditEntity;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  searchTerm?: string;
}
