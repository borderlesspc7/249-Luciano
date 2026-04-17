import type { ForwardedChecklistItem } from "../contexts/ForwardedChecklistsContext";
import type { ChecklistDraft } from "../contexts/ChecklistDraftsContext";
import type { GanttTask } from "../components/CommissioningGanttChart/types";
import {
  checklistProgressPercentFromRoute,
  parseEquipmentIdsFromForwardedField,
} from "./checklistRouteProgress";

function normProject(p?: string | null): string {
  const t = p?.trim();
  return t && t.length > 0 ? t : "FW+";
}

/** Mesmo projeto (FW+ quando vazio), ignorando maiúsculas */
export function projectsMatch(a?: string | null, b?: string | null): boolean {
  return normProject(a).toLowerCase() === normProject(b).toLowerCase();
}

function parseIsoDate(s?: string | null): string | null {
  if (!s || typeof s !== "string") return null;
  const d = s.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null;
}

function defaultEndFromStart(startIso: string, days: number): string {
  const d = new Date(`${startIso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Mesma regra de “ok” usada em forwardedChecklistService ao criar o documento */
function answerIsOk(key: string, value: "yes" | "no"): boolean {
  if (key === "finalChecks:final_leak") return value === "no";
  return value === "yes";
}

/** Só para itens sem lista de equipamentos (ex.: ação corretiva isolada) */
function progressFromAnswers(answers: Record<string, "yes" | "no">): number {
  const entries = Object.entries(answers);
  if (entries.length === 0) return 0;
  const ok = entries.filter(([k, v]) => answerIsOk(k, v)).length;
  return Math.round((ok / entries.length) * 100);
}

function forwardedProgressPercent(item: ForwardedChecklistItem): number {
  if (item.status === "done") return 100;
  if (item.kind === "resolved_action" || item.equipmentId?.startsWith("resolved:")) {
    return progressFromAnswers(item.answers ?? {});
  }
  const equipmentIds = parseEquipmentIdsFromForwardedField(
    item.equipmentName || item.equipmentId
  );
  return checklistProgressPercentFromRoute(
    equipmentIds,
    item.instrumentInstances ?? [],
    item.answers ?? {}
  );
}

function inferCategory(folder?: string, route?: string): GanttTask["categoria"] {
  const s = `${folder ?? ""} ${route ?? ""}`.toLowerCase();
  if (/el[eé]tr|eletric/.test(s)) return "eletrica";
  if (/instrum|calibra/.test(s)) return "instrumentacao";
  if (/mec[aâ]n|hidr[aá]ul|montagem/.test(s)) return "mecanica";
  if (/clp|autom|plc|config/.test(s)) return "automacao";
  return "utilidades";
}

function areaNameFromCategory(category: GanttTask["categoria"]): string {
  switch (category) {
    case "eletrica":
      return "Elétrica";
    case "instrumentacao":
      return "Instrumentação";
    case "mecanica":
      return "Mecânica";
    case "automacao":
      return "Automação";
    case "utilidades":
      return "Utilidades";
    default:
      return String(category || "Área");
  }
}

export type ForwardedToGanttOptions = {
  /** Projeto selecionado na app (Homepage / contexto) */
  projectName?: string;
  /** Só checklists criados por este usuário (recomendado no Gantt) */
  userId?: string;
  /**
   * Nomes de pasta (minúsculas) que ainda existem no projeto em Áreas.
   * Quando informado, só entram encaminhamentos cuja `folderName` coincide com uma dessas pastas.
   * Assim, ao apagar diretórios, as barras somem — alinhado à estrutura atual da app.
   */
  existingFolderNamesLower?: Set<string>;
  /** Mapa opcional pasta->área (chave em minúsculas). */
  folderAreaNameByFolderLower?: Map<string, string>;
};

/**
 * Converte checklists encaminhados (Firestore) em tarefas do Gantt.
 * - Filtra por `userId` quando informado (só os seus).
 * - Filtra por projeto com comparação case-insensitive (FW+ quando vazio).
 * - Se `existingFolderNamesLower` for passado, exige pasta ainda existente (match por nome, ignorando maiúsculas).
 */
export function forwardedItemsToGanttTasks(
  items: ForwardedChecklistItem[],
  options?: ForwardedToGanttOptions
): GanttTask[] {
  let list = items;

  if (options?.userId) {
    list = list.filter((i) => i.userId === options.userId);
  }

  const targetProject = options?.projectName;
  let filtered =
    targetProject !== undefined && targetProject !== null
      ? list.filter((i) => projectsMatch(i.projectName, targetProject))
      : list;

  const folderSet = options?.existingFolderNamesLower;
  const folderAreaMap = options?.folderAreaNameByFolderLower;
  if (folderSet) {
    filtered = filtered.filter((i) => {
      const key = i.folderName?.trim().toLowerCase();
      return !!key && folderSet.has(key);
    });
  }

  return filtered.map((item) => {
    const start =
      parseIsoDate(item.startDate) ??
      parseIsoDate(item.forwardedAt) ??
      new Date().toISOString().slice(0, 10);

    const end =
      parseIsoDate(item.endDate) ??
      parseIsoDate(item.deadline) ??
      defaultEndFromStart(start, 14);

    const pct = forwardedProgressPercent(item);

    const nome =
      item.equipmentName?.trim() ||
      item.routeName?.trim() ||
      item.folderName?.trim() ||
      "Checklist";

    const nomeRota = item.routeName?.trim() || undefined;
    const categoria = inferCategory(item.folderName, item.routeName);
    const folderKey = item.folderName?.trim().toLowerCase();
    const nomeArea =
      (folderKey ? folderAreaMap?.get(folderKey)?.trim() : undefined) ||
      areaNameFromCategory(categoria);

    return {
      id: item.id,
      nome,
      responsavel: item.responsible?.trim() || "—",
      categoria,
      nomeArea,
      nomeDiretorio: item.folderName?.trim() || "Sem diretório",
      nomeRota,
      data_inicio: start,
      data_fim: end,
      percentual_concluido: pct,
    };
  });
}

function taskStartKey(dataInicio: string | Date): string {
  if (dataInicio instanceof Date) return dataInicio.toISOString().slice(0, 10);
  return String(dataInicio).slice(0, 10);
}

/**
 * Rascunhos salvos no Firestore (checklist em andamento).
 * Mesmos filtros de projeto / pasta que os encaminhamentos.
 */
export function checklistDraftsToGanttTasks(
  drafts: ChecklistDraft[],
  options?: ForwardedToGanttOptions
): GanttTask[] {
  let list = drafts;

  if (options?.userId) {
    list = list.filter((d) => d.userId === options.userId);
  }

  const targetProject = options?.projectName;
  if (targetProject !== undefined && targetProject !== null) {
    list = list.filter((d) => projectsMatch(d.projectName, targetProject));
  }

  const folderSet = options?.existingFolderNamesLower;
  const folderAreaMap = options?.folderAreaNameByFolderLower;
  if (folderSet) {
    list = list.filter((d) => {
      const key = d.folderName?.trim().toLowerCase();
      return !!key && folderSet.has(key);
    });
  }

  return list.map((draft) => {
    const start =
      parseIsoDate(draft.startDate) ??
      parseIsoDate(draft.createdAt) ??
      new Date().toISOString().slice(0, 10);
    const end =
      parseIsoDate(draft.endDate) ?? defaultEndFromStart(start, 14);
    const pct = checklistProgressPercentFromRoute(
      draft.equipmentIds ?? [],
      draft.instrumentInstances ?? [],
      draft.answers ?? {}
    );
    const equip = draft.equipmentIds?.filter(Boolean).join(", ");
    const nome =
      (equip && equip.trim()) ||
      draft.routeName?.trim() ||
      "Checklist em andamento";

    const nomeRota = draft.routeName?.trim() || undefined;
    const categoria = inferCategory(draft.folderName, draft.routeName);
    const folderKey = draft.folderName?.trim().toLowerCase();
    const nomeArea =
      (folderKey ? folderAreaMap?.get(folderKey)?.trim() : undefined) ||
      areaNameFromCategory(categoria);

    return {
      id: `draft:${draft.id}`,
      nome,
      draftId: draft.id,
      responsavel: "—",
      categoria,
      nomeArea,
      nomeDiretorio: draft.folderName?.trim() || "Sem diretório",
      nomeRota,
      data_inicio: start,
      data_fim: end,
      percentual_concluido: pct,
    };
  });
}

/** Junta rascunhos salvos + encaminhados, ordenados por data de início */
export function buildGanttTasksFromChecklists(
  drafts: ChecklistDraft[],
  forwarded: ForwardedChecklistItem[],
  options?: ForwardedToGanttOptions
): GanttTask[] {
  const a = checklistDraftsToGanttTasks(drafts, options);
  const b = forwardedItemsToGanttTasks(forwarded, options);
  return [...a, ...b].sort(
    (x, y) => taskStartKey(x.data_inicio).localeCompare(taskStartKey(y.data_inicio))
  );
}
''