export interface Machine {
  id: string;
  name: string;
  type: "machine" | "process";
  status: "active" | "inactive" | "maintenance";
  description?: string;
  clusterId?: string;
  clusterName?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export interface Cluster {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface CreateMachineData {
  name: string;
  type: "machine" | "process";
  description?: string;
  clusterId?: string;
}

export interface UpdateMachineData extends Partial<CreateMachineData> {
  status?: "active" | "inactive" | "maintenance";
  clusterName?: string;
}
