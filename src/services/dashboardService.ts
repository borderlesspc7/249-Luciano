import type { DashboardStats, ActivityItem } from "../types/dashboard";
import { ProjectService } from "./projectService";
import { AssetService } from "./assetService";
import { ChecklistExecutionService } from "./checklistExecutionService";
import type { Project } from "../types/projects";

export class DashboardService {
  static async getDashboardStats(): Promise<DashboardStats> {
    const [projects, assets, executions] = await Promise.all([
      ProjectService.list(),
      AssetService.listAll(),
      this.getExecutionsByProjects((await ProjectService.list()).map((p) => p.id)),
    ]);
    return this.computeStats(projects, assets.length, executions);
  }

  private static async getExecutionsByProjects(projectIds: string[]): Promise<{ status: string }[]> {
    const all: { status: string }[] = [];
    for (const id of projectIds) {
      const list = await ChecklistExecutionService.listByProject(id);
      all.push(...list.map((e) => ({ status: e.status })));
    }
    return all;
  }

  static computeStats(
    projects: Project[],
    totalMachines: number,
    executions: { status: string }[]
  ): DashboardStats {
    const totalProjects = projects.length;
    const draft = executions.filter((e) => e.status === "draft").length;
    const submitted = executions.filter((e) => e.status === "submitted").length;
    const approved = executions.filter((e) => e.status === "approved").length;
    const rejected = executions.filter((e) => e.status === "rejected").length;
    const totalTests = executions.length;
    const completedTests = approved;
    const pendingTests = draft + submitted;
    const failedTests = rejected;
    const overdueTests = 0;
    const completionRate = totalTests > 0 ? (completedTests / totalTests) * 100 : 0;

    const recentActivity: ActivityItem[] = projects
      .slice(0, 8)
      .map((p) => ({
        id: `project-${p.id}`,
        type: "project_created" as const,
        title: "Projeto",
        description: p.name,
        timestamp: p.createdAt,
        userId: p.createdBy,
        userName: "Sistema",
      }));

    return {
      totalProjects,
      totalMachines,
      completedTests,
      pendingTests,
      failedTests,
      overdueTests,
      completionRate,
      averageTestTime: 0,
      recentActivity,
    };
  }

  static subscribeToDashboardStats(
    onData: (stats: DashboardStats) => void,
    onError?: (err: Error) => void
  ): () => void {
    return ProjectService.subscribeToList((projects) => {
      Promise.all([
        AssetService.listAll(),
        this.getExecutionsByProjects(projects.map((p) => p.id)),
      ])
        .then(([assets, executions]) => {
          onData(this.computeStats(projects, assets.length, executions));
        })
        .catch((err) => {
          onError?.(err);
        });
    });
  }
}
