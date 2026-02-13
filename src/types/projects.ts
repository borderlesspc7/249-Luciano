export interface Project {
  id: string;
  name: string;
  description?: string;
  status: "active" | "completed" | "overdue" | "cancelled";
  startDate: Date;
  endDate?: Date;
  expectedEndDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
  managerId?: string;
  managerName?: string;
}

export interface CreateProjectData {
  name: string;
  description?: string;
  startDate: Date;
  expectedEndDate?: Date;
  managerId?: string;
}

export interface UpdateProjectData extends Partial<CreateProjectData> {
  status?: "active" | "completed" | "overdue" | "cancelled";
  endDate?: Date;
}
