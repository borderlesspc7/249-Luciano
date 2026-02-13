import type { ChecklistTemplateField, SelectOption } from "../types/checklistTemplates";

/**
 * Gera slug estável a partir do label: minúsculo, acentos removidos, espaços → underscore.
 */
export function labelToSlug(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    || "campo";
}

/**
 * Gera um fieldId único a partir do label. Se já existir id igual, adiciona sufixo _2, _3...
 */
export function generateUniqueFieldId(label: string, existingIds: string[]): string {
  const base = labelToSlug(label);
  const set = new Set(existingIds);
  if (!set.has(base)) return base;
  let n = 2;
  while (set.has(`${base}_${n}`)) n++;
  return `${base}_${n}`;
}

/**
 * Gera value único para opção de select (slug). existingValues = valores já usados no mesmo campo.
 */
export function uniqueOptionValue(label: string, existingValues: string[]): string {
  return generateUniqueFieldId(label.trim() || "opcao", existingValues);
}

/**
 * Normaliza options de template: aceita legado (string[]) ou novo formato (SelectOption[]).
 */
export function normalizeFieldOptions(
  options: string[] | SelectOption[] | undefined
): SelectOption[] {
  if (!options || options.length === 0) return [];
  const first = options[0];
  if (typeof first === "string") {
    return (options as string[]).map((s) => ({ value: labelToSlug(s) || s, label: s }));
  }
  return options as SelectOption[];
}

/**
 * Garante que um field vindo do Firestore tenha options no formato SelectOption[].
 */
export function normalizeTemplateField(f: ChecklistTemplateField): ChecklistTemplateField {
  if (f.type !== "select") return { ...f, options: undefined };
  const opts = normalizeFieldOptions(f.options);
  return { ...f, options: opts.length > 0 ? opts : undefined };
}
