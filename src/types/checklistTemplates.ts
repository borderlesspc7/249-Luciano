export type ChecklistFieldType = "text" | "number" | "boolean" | "select";

export interface SelectOption {
  value: string;
  label: string;
}

export interface ChecklistTemplateField {
  id: string;
  label: string;
  type: ChecklistFieldType;
  required: boolean;
  /** Para tipo select: opções com value (slug) e label (exibição). */
  options?: SelectOption[];
  validationRules?: string;
}

export interface ChecklistTemplate {
  id: string;
  name: string;
  description?: string;
  version: number;
  fields: ChecklistTemplateField[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface CreateChecklistTemplateData {
  name: string;
  description?: string;
  fields: ChecklistTemplateField[];
}

export interface UpdateChecklistTemplateData {
  name?: string;
  description?: string;
  fields?: ChecklistTemplateField[];
}
