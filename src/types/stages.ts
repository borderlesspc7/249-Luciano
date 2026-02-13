export type StageType = "visual" | "funcional" | "performance";

export interface Stage {
  id: string;
  projectId: string;
  name: string;
  type: StageType;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface CreateStageData {
  projectId: string;
  name: string;
  type: StageType;
  order: number;
}

export interface UpdateStageData {
  name?: string;
  type?: StageType;
  order?: number;
}
