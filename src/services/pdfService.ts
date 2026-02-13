import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Project } from "../types/projects";
import type { Component } from "../types/components";
import type { CommissioningStep } from "../types/commissioning";
import type { UserManagement } from "../types/userManagement";

export class PDFService {
  /**
   * Gera relatório de validação de projeto
   */
  static async generateProjectValidationReport(
    project: Project,
    components: Component[],
    steps: CommissioningStep[],
    manager?: UserManagement
  ): Promise<Blob> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let yPosition = margin;

    // Cabeçalho
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("RELATÓRIO DE VALIDAÇÃO TÉCNICA", pageWidth / 2, yPosition, {
      align: "center",
    });
    yPosition += 10;

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Projeto: ${project.name}`,
      margin,
      yPosition,
      { maxWidth: pageWidth - 2 * margin }
    );
    yPosition += 7;

    if (project.description) {
      doc.setFontSize(10);
      doc.text(
        `Descrição: ${project.description}`,
        margin,
        yPosition,
        { maxWidth: pageWidth - 2 * margin }
      );
      yPosition += 7;
    }

    // Informações do projeto
    yPosition += 5;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("INFORMAÇÕES DO PROJETO", margin, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const projectInfo = [
      ["Status:", this.getStatusLabel(project.status)],
      ["Data de Início:", project.startDate.toLocaleDateString("pt-BR")],
      [
        "Data Prevista:",
        project.expectedEndDate
          ? project.expectedEndDate.toLocaleDateString("pt-BR")
          : "Não definida",
      ],
      [
        "Data de Término:",
        project.endDate ? project.endDate.toLocaleDateString("pt-BR") : "Em andamento",
      ],
      ["Gerente:", manager?.name || project.managerName || "Não definido"],
    ];

    projectInfo.forEach(([label, value]) => {
      doc.text(`${label} ${value}`, margin, yPosition);
      yPosition += 6;
    });

    // Componentes
    if (components.length > 0) {
      yPosition += 5;
      if (yPosition > 250) {
        doc.addPage();
        yPosition = margin;
      }

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("COMPONENTES DA INSTALAÇÃO", margin, yPosition);
      yPosition += 8;

      autoTable(doc, {
        startY: yPosition,
        head: [["Nome", "Tipo", "Status", "Número de Série"]],
        body: components.map((comp) => [
          comp.name,
          comp.type,
          this.getComponentStatusLabel(comp.status),
          comp.serialNumber || "-",
        ]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [102, 126, 234] },
        margin: { left: margin, right: margin },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 10;
    }

    // Etapas de Comissionamento
    if (steps.length > 0) {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = margin;
      }

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("ETAPAS DE COMISSIONAMENTO", margin, yPosition);
      yPosition += 8;

      autoTable(doc, {
        startY: yPosition,
        head: [["Etapa", "Tipo", "Status", "Responsável", "Prazo"]],
        body: steps.map((step) => [
          step.name,
          this.getStepTypeLabel(step.type),
          this.getStepStatusLabel(step.status),
          step.assignedToName || "-",
          step.dueDate ? step.dueDate.toLocaleDateString("pt-BR") : "-",
        ]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [102, 126, 234] },
        margin: { left: margin, right: margin },
      });
    }

    // Rodapé
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.text(
        `Página ${i} de ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: "center" }
      );
      doc.text(
        `Gerado em ${new Date().toLocaleString("pt-BR")}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 5,
        { align: "center" }
      );
    }

    return doc.output("blob");
  }

  /**
   * Gera certificado técnico de comissionamento
   */
  static async generateCommissioningCertificate(
    project: Project,
    steps: CommissioningStep[],
    completedBy: UserManagement,
    approvedBy?: UserManagement
  ): Promise<Blob> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 30;

    // Borda decorativa
    doc.setDrawColor(102, 126, 234);
    doc.setLineWidth(2);
    doc.rect(margin, margin, pageWidth - 2 * margin, pageHeight - 2 * margin);

    // Título
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("CERTIFICADO TÉCNICO", pageWidth / 2, margin + 30, {
      align: "center",
    });

    doc.setFontSize(16);
    doc.setFont("helvetica", "normal");
    doc.text("DE COMISSIONAMENTO E VALIDAÇÃO", pageWidth / 2, margin + 45, {
      align: "center",
    });

    // Conteúdo
    let yPosition = margin + 70;

    doc.setFontSize(12);
    doc.text(
      "Certificamos que o projeto de comissionamento e validação foi executado",
      pageWidth / 2,
      yPosition,
      { align: "center", maxWidth: pageWidth - 2 * margin }
    );
    yPosition += 15;

    doc.setFont("helvetica", "bold");
    doc.text(project.name, pageWidth / 2, yPosition, {
      align: "center",
      maxWidth: pageWidth - 2 * margin,
    });
    yPosition += 15;

    doc.setFont("helvetica", "normal");
    doc.text(
      "conforme as especificações técnicas e normas aplicáveis.",
      pageWidth / 2,
      yPosition,
      { align: "center", maxWidth: pageWidth - 2 * margin }
    );
    yPosition += 30;

    // Etapas concluídas
    const completedSteps = steps.filter((s) => s.status === "completed");
    if (completedSteps.length > 0) {
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Etapas Concluídas:", margin + 10, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      completedSteps.forEach((step) => {
        doc.text(`• ${step.name}`, margin + 15, yPosition);
        yPosition += 7;
      });
      yPosition += 10;
    }

    // Assinaturas
    yPosition = pageHeight - margin - 80;

    // Executado por
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Executado por:", margin + 10, yPosition);
    yPosition += 15;

    doc.setFont("helvetica", "normal");
    doc.text(completedBy.name, margin + 10, yPosition);
    yPosition += 5;
    doc.setFontSize(9);
    doc.text(
      `CPF/Registro: ${completedBy.email}`,
      margin + 10,
      yPosition
    );
    yPosition += 15;

    // Linha de assinatura
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(margin + 10, yPosition, margin + 80, yPosition);
    yPosition += 5;
    doc.setFontSize(8);
    doc.text("Assinatura", margin + 10, yPosition);

    // Aprovado por (se houver)
    if (approvedBy) {
      yPosition = pageHeight - margin - 80;
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Aprovado por:", pageWidth - margin - 80, yPosition);
      yPosition += 15;

      doc.setFont("helvetica", "normal");
      doc.text(approvedBy.name, pageWidth - margin - 80, yPosition);
      yPosition += 5;
      doc.setFontSize(9);
      doc.text(
        `CPF/Registro: ${approvedBy.email}`,
        pageWidth - margin - 80,
        yPosition
      );
      yPosition += 15;

      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.line(
        pageWidth - margin - 80,
        yPosition,
        pageWidth - margin - 10,
        yPosition
      );
      yPosition += 5;
      doc.setFontSize(8);
      doc.text("Assinatura", pageWidth - margin - 80, yPosition);
    }

    // Data e local
    yPosition = pageHeight - margin - 30;
    doc.setFontSize(10);
    doc.text(
      `${new Date().toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })}`,
      pageWidth / 2,
      yPosition,
      { align: "center" }
    );

    return doc.output("blob");
  }

  /**
   * Gera ata de comissionamento
   */
  static async generateCommissioningMinutes(
    project: Project,
    steps: CommissioningStep[],
    participants: UserManagement[]
  ): Promise<Blob> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let yPosition = margin;

    // Cabeçalho
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("ATA DE COMISSIONAMENTO", pageWidth / 2, yPosition, {
      align: "center",
    });
    yPosition += 15;

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Projeto: ${project.name}`,
      margin,
      yPosition,
      { maxWidth: pageWidth - 2 * margin }
    );
    yPosition += 10;

    doc.text(
      `Data: ${new Date().toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })}`,
      margin,
      yPosition
    );
    yPosition += 15;

    // Participantes
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("PARTICIPANTES:", margin, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    participants.forEach((participant) => {
      doc.text(`• ${participant.name} - ${participant.email}`, margin + 5, yPosition);
      yPosition += 7;
    });

    yPosition += 10;

    // Etapas
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("ETAPAS EXECUTADAS:", margin, yPosition);
    yPosition += 8;

    steps.forEach((step, index) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = margin;
      }

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(`${index + 1}. ${step.name}`, margin, yPosition);
      yPosition += 7;

      doc.setFont("helvetica", "normal");
      doc.text(`   Tipo: ${this.getStepTypeLabel(step.type)}`, margin, yPosition);
      yPosition += 6;
      doc.text(
        `   Status: ${this.getStepStatusLabel(step.status)}`,
        margin,
        yPosition
      );
      yPosition += 6;
      if (step.assignedToName) {
        doc.text(`   Responsável: ${step.assignedToName}`, margin, yPosition);
        yPosition += 6;
      }
      if (step.notes) {
        doc.text(`   Observações: ${step.notes}`, margin, yPosition, {
          maxWidth: pageWidth - 2 * margin - 5,
        });
        yPosition += 10;
      } else {
        yPosition += 4;
      }
    });

    // Rodapé
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.text(
        `Página ${i} de ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: "center" }
      );
    }

    return doc.output("blob");
  }

  // Métodos auxiliares
  private static getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      active: "Ativo",
      completed: "Concluído",
      overdue: "Em Atraso",
      cancelled: "Cancelado",
    };
    return labels[status] || status;
  }

  private static getComponentStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: "Pendente",
      installed: "Instalado",
      tested: "Testado",
      approved: "Aprovado",
      rejected: "Rejeitado",
    };
    return labels[status] || status;
  }

  private static getStepStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: "Pendente",
      in_progress: "Em Andamento",
      completed: "Concluída",
      failed: "Falhou",
      skipped: "Pulada",
    };
    return labels[status] || status;
  }

  private static getStepTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      visual_inspection: "Inspeção Visual",
      functional_test: "Teste Funcional",
      performance_test: "Teste de Performance",
      safety_test: "Teste de Segurança",
      documentation: "Documentação",
      approval: "Aprovação",
    };
    return labels[type] || type;
  }
}
