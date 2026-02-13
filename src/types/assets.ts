export interface Asset {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  type?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface CreateAssetData {
  projectId: string;
  name: string;
  description?: string;
  type?: string;
}

export interface UpdateAssetData {
  name?: string;
  description?: string;
  type?: string;
}
