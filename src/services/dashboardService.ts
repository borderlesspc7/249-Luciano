import type {
  DashboardStats,
  ActivityItem,
  TestMetrics,
  ProjectMetrics,
  MachineMetrics,
} from "../types/dashboard";
import { MachineService } from "./machineService";
import { UserService } from "./userService";
import type { Machine } from "../types/machines";
import type { UserManagement } from "../types/userManagement";

export class DashboardService {
  static async getDashboardStats(): Promise<DashboardStats> {
    try {
      // Buscar dados reais do Firebase
      const [machines, activities] = await Promise.all([
        MachineService.getMachines(),
        this.getRecentActivity(),
      ]);

      // Calcular métricas baseadas nos dados reais
      const testMetrics = this.calculateTestMetrics(machines);
      const projectMetrics = this.calculateProjectMetrics(machines);
      const machineMetrics = this.calculateMachineMetrics(machines);

      return {
        totalProjects: projectMetrics.totalProjects,
        totalMachines: machineMetrics.totalMachines,
        completedTests: testMetrics.completedTests,
        pendingTests: testMetrics.pendingTests,
        failedTests: testMetrics.failedTests,
        overdueTests: testMetrics.overdueTests,
        completionRate: testMetrics.completionRate,
        averageTestTime: testMetrics.averageTestTime,
        recentActivity: activities,
      };
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      throw error;
    }
  }

  private static async getRecentActivity(): Promise<ActivityItem[]> {
    try {
      // Buscar atividades recentes das máquinas
      const machines = await MachineService.getMachines();
      const activities: ActivityItem[] = [];

      // Criar atividades baseadas nas máquinas mais recentes
      machines.slice(0, 5).forEach((machine) => {
        activities.push({
          id: `machine-${machine.id}`,
          type: "machine_created",
          title: "Máquina Cadastrada",
          description: `${machine.name} foi ${
            machine.type === "machine" ? "cadastrada" : "criada"
          } no sistema`,
          timestamp: machine.createdAt,
          userId: machine.createdBy,
          userName: "Sistema", // Em produção, buscar nome do usuário
        });
      });

      // Ordenar por timestamp mais recente
      return activities.sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
      );
    } catch (error) {
      console.error("Error fetching recent activity:", error);
      return [];
    }
  }

  private static calculateTestMetrics(machines: Machine[]): TestMetrics {
    // Simular dados de testes baseados nas máquinas
    // Em produção, isso viria de uma coleção 'tests' no Firestore
    const totalTests = machines.length * 2; // 2 testes por máquina em média
    const completedTests = Math.floor(totalTests * 0.6); // 60% concluídos
    const pendingTests = Math.floor(totalTests * 0.3); // 30% pendentes
    const failedTests = Math.floor(totalTests * 0.05); // 5% falharam
    const overdueTests = Math.floor(totalTests * 0.05); // 5% em atraso

    return {
      totalTests,
      completedTests,
      pendingTests,
      failedTests,
      overdueTests,
      completionRate: totalTests > 0 ? (completedTests / totalTests) * 100 : 0,
      averageTestTime: 2.5, // horas
    };
  }

  private static calculateProjectMetrics(machines: Machine[]): ProjectMetrics {
    // Calcular projetos baseados nas máquinas
    // Assumindo que cada 2-3 máquinas formam um projeto
    const totalProjects = Math.ceil(machines.length / 2);
    const activeProjects = Math.floor(totalProjects * 0.8);
    const completedProjects = Math.floor(totalProjects * 0.15);
    const overdueProjects = Math.floor(totalProjects * 0.05);

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      overdueProjects,
    };
  }

  private static calculateMachineMetrics(machines: Machine[]): MachineMetrics {
    const totalMachines = machines.length;
    const activeMachines = machines.filter((m) => m.status === "active").length;
    const inactiveMachines = machines.filter(
      (m) => m.status === "inactive"
    ).length;
    const maintenanceMachines = machines.filter(
      (m) => m.status === "maintenance"
    ).length;

    return {
      totalMachines,
      activeMachines,
      inactiveMachines,
      maintenanceMachines,
    };
  }

  static async getTestProgress(): Promise<{
    completed: number;
    total: number;
  }> {
    try {
      const machines = await MachineService.getMachines();
      const total = machines.length * 2; // 2 testes por máquina
      const completed = Math.floor(total * 0.6); // 60% concluídos

      return { completed, total };
    } catch (error) {
      console.error("Error fetching test progress:", error);
      return { completed: 0, total: 0 };
    }
  }

  static async getOverdueItems(): Promise<number> {
    try {
      const machines = await MachineService.getMachines();
      // Simular itens em atraso baseado nas máquinas
      return Math.floor(machines.length * 0.1); // 10% das máquinas em atraso
    } catch (error) {
      console.error("Error fetching overdue items:", error);
      return 0;
    }
  }

  static async getMachineStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    maintenance: number;
  }> {
    try {
      const machines = await MachineService.getMachines();

      return {
        total: machines.length,
        active: machines.filter((m) => m.status === "active").length,
        inactive: machines.filter((m) => m.status === "inactive").length,
        maintenance: machines.filter((m) => m.status === "maintenance").length,
      };
    } catch (error) {
      console.error("Error fetching machine stats:", error);
      return { total: 0, active: 0, inactive: 0, maintenance: 0 };
    }
  }

  static async getUserStats(): Promise<{
    total: number;
    active: number;
    admin: number;
    regular: number;
  }> {
    try {
      const users = await UserService.getUsers();

      return {
        total: users.length,
        active: users.filter((u: UserManagement) => u.status === "active")
          .length,
        admin: users.filter((u: UserManagement) => u.role === "admin").length,
        regular: users.filter((u: UserManagement) => u.role === "user").length,
      };
    } catch (error) {
      console.error("Error fetching user stats:", error);
      return { total: 0, active: 0, admin: 0, regular: 0 };
    }
  }
}
