export interface Component {
  id: string;
  assetId: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface CreateComponentData {
  assetId: string;
  name: string;
  description?: string;
}

export interface UpdateComponentData {
  name?: string;
  description?: string;
}
