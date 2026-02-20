export interface Project {
  id: string;
  name: string;
  description?: string;
  status: "active" | "completed" | "on_hold" | "overdue" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  startDate?: Date;
  expectedEndDate?: Date;
  endDate?: Date;
  managerId?: string;
  managerName?: string;
}

export interface CreateProjectData {
  name: string;
  description?: string;
  status?: Project["status"];
  startDate?: Date;
  expectedEndDate?: Date;
  managerId?: string;
}

export interface UpdateProjectData extends Partial<CreateProjectData> {
  endDate?: Date;
}
