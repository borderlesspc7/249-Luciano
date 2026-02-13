export interface Project {
  id: string;
  name: string;
  description?: string;
  status: "active" | "completed" | "on_hold";
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface CreateProjectData {
  name: string;
  description?: string;
  status?: Project["status"];
}

export interface UpdateProjectData extends Partial<CreateProjectData> {}
