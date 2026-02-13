export interface Component {
  id: string;
  name: string;
  description?: string;
  type: string;
  serialNumber?: string;
  manufacturer?: string;
  model?: string;
  projectId: string;
  projectName?: string;
  machineId?: string;
  machineName?: string;
  status: "pending" | "installed" | "tested" | "approved" | "rejected";
  installationDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export interface CreateComponentData {
  name: string;
  description?: string;
  type: string;
  serialNumber?: string;
  manufacturer?: string;
  model?: string;
  projectId: string;
  machineId?: string;
  installationDate?: Date;
}

export interface UpdateComponentData extends Partial<CreateComponentData> {
  status?: "pending" | "installed" | "tested" | "approved" | "rejected";
}
