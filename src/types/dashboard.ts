export interface DashboardStats {
  totalProjects: number;
  totalMachines: number;
  completedTests: number;
  pendingTests: number;
  failedTests: number;
  overdueTests: number;
  completionRate: number;
  averageTestTime: number;
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type:
    | "test_completed"
    | "test_failed"
    | "machine_created"
    | "project_created";
  title: string;
  description: string;
  timestamp: Date;
  userId: string;
  userName: string;
}

export interface TestMetrics {
  totalTests: number;
  completedTests: number;
  pendingTests: number;
  failedTests: number;
  overdueTests: number;
  completionRate: number;
  averageTestTime: number;
}

export interface ProjectMetrics {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  overdueProjects: number;
}

export interface MachineMetrics {
  totalMachines: number;
  activeMachines: number;
  inactiveMachines: number;
  maintenanceMachines: number;
}
