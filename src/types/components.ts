export type ComponentStatus =
  | "pending"
  | "installed"
  | "tested"
  | "approved"
  | "rejected";

export interface Component {
  id: string;
  assetId: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  type?: string;
  serialNumber?: string;
  manufacturer?: string;
  model?: string;
  projectId?: string;
  machineId?: string;
  installationDate?: Date;
  status?: ComponentStatus;
  projectName?: string;
  machineName?: string;
}

export interface CreateComponentData {
  assetId?: string;
  name: string;
  description?: string;
  type?: string;
  serialNumber?: string;
  manufacturer?: string;
  model?: string;
  projectId?: string;
  machineId?: string;
  installationDate?: Date;
  status?: ComponentStatus;
}

export interface UpdateComponentData {
  name?: string;
  description?: string;
  type?: string;
  serialNumber?: string;
  manufacturer?: string;
  model?: string;
  projectId?: string;
  machineId?: string;
  installationDate?: Date;
  status?: ComponentStatus;
}
