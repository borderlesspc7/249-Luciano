export type CommissioningStepType =
  | "visual_inspection"
  | "functional_test"
  | "performance_test"
  | "safety_test"
  | "documentation"
  | "approval";

export type StepStatus = "pending" | "in_progress" | "completed" | "failed" | "skipped";

export interface CommissioningStep {
  id: string;
  name: string;
  description?: string;
  type: CommissioningStepType;
  status: StepStatus;
  projectId: string;
  projectName?: string;
  componentId?: string;
  componentName?: string;
  machineId?: string;
  machineName?: string;
  assignedTo?: string;
  assignedToName?: string;
  startedAt?: Date;
  completedAt?: Date;
  dueDate?: Date;
  notes?: string;
  evidence?: Evidence[];
  approvals?: Approval[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export interface Evidence {
  id: string;
  type: "photo" | "document" | "video" | "signature";
  url: string;
  fileName: string;
  uploadedAt: Date;
  uploadedBy: string;
  description?: string;
}

export interface Approval {
  id: string;
  userId: string;
  userName: string;
  role: string;
  status: "pending" | "approved" | "rejected";
  comments?: string;
  approvedAt?: Date;
  signature?: string; // URL da assinatura
}

export interface CreateCommissioningStepData {
  name: string;
  description?: string;
  type: CommissioningStepType;
  projectId: string;
  componentId?: string;
  machineId?: string;
  assignedTo?: string;
  dueDate?: Date;
}

export interface UpdateCommissioningStepData {
  status?: StepStatus;
  notes?: string;
  assignedTo?: string;
  dueDate?: Date;
  completedAt?: Date;
}
