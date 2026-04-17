/**
 * Mesma regra de progresso da lista de checklists em Áreas (main-menu: getDraftProgress):
 * denominador = total de perguntas ativas da rota (equipamentos + instrumentos + final),
 * numerador = perguntas já "ok" (yes, ou final_leak = no).
 */
import { SECTIONS, buildQuestionsForEquipment } from "../app/commissioning-checklist";

export type InstrumentInstanceLike = {
  instanceId: string;
  sectionId: string;
  itemId: string;
};

function buildActiveQuestionKeys(input: {
  equipmentIds: string[];
  instrumentInstances: InstrumentInstanceLike[];
}): string[] {
  const OPTIONAL_SECTIONS = SECTIONS.filter((section) => section.id !== "finalChecks");
  const FINAL_SECTION = SECTIONS.find((section) => section.id === "finalChecks") ?? null;

  const activeQuestionKeys: string[] = [];

  input.equipmentIds.forEach((eq, index) => {
    const sectionId = `equipment:${eq}:${index}`;
    const questions = buildQuestionsForEquipment(eq);
    questions.forEach((q) => {
      activeQuestionKeys.push(`${sectionId}:${q.id}`);
    });
  });

  (input.instrumentInstances ?? []).forEach(({ instanceId, sectionId, itemId }) => {
    const section = OPTIONAL_SECTIONS.find((s) => s.id === sectionId);
    const item = section?.items.find((i) => i.id === itemId);
    if (item) {
      item.questions.forEach((q) => {
        activeQuestionKeys.push(`${instanceId}:${q.id}`);
      });
    }
  });

  const hasInstruments = (input.instrumentInstances ?? []).length > 0;
  if (FINAL_SECTION && (input.equipmentIds.length > 0 || hasInstruments)) {
    FINAL_SECTION.items[0].questions.forEach((q) => {
      activeQuestionKeys.push(`finalChecks:${q.id}`);
    });
  }

  return activeQuestionKeys;
}

function countCompletedAnswers(
  activeKeys: string[],
  answers: Record<string, "yes" | "no">
): number {
  return activeKeys.filter((key) => {
    const value = answers[key];
    if (!value) return false;
    if (key === "finalChecks:final_leak") return value === "no";
    return value === "yes";
  }).length;
}

/** Percentual 0–100 igual à barra da rota em Áreas */
export function checklistProgressPercentFromRoute(
  equipmentIds: string[],
  instrumentInstances: InstrumentInstanceLike[],
  answers: Record<string, "yes" | "no">
): number {
  const activeKeys = buildActiveQuestionKeys({ equipmentIds, instrumentInstances });
  if (activeKeys.length === 0) return 0;
  const done = countCompletedAnswers(activeKeys, answers);
  return Math.round((done / activeKeys.length) * 100);
}

/** Lista de equipamentos a partir do texto salvo no encaminhamento (join com ", "). */
export function parseEquipmentIdsFromForwardedField(raw: string | undefined): string[] {
  const t = raw?.trim();
  if (!t) return [];
  return t.split(/\s*,\s*/).map((s) => s.trim()).filter(Boolean);
}
