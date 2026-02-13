import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "../lib/firebaseconfig";
import type {
  ChecklistTemplate,
  ChecklistTemplateField,
  CreateChecklistTemplateData,
  UpdateChecklistTemplateData,
} from "../types/checklistTemplates";
import { normalizeTemplateField } from "../utils/checklistTemplateUtils";

const COLLECTION = "checklistTemplates";

function normalizeFields(fields: ChecklistTemplateField[] | undefined): ChecklistTemplateField[] {
  if (!fields || !Array.isArray(fields)) return [];
  return fields.map(normalizeTemplateField);
}

function toTemplate(id: string, data: Record<string, unknown>): ChecklistTemplate {
  const createdAt = data.createdAt as { toDate?: () => Date };
  const updatedAt = data.updatedAt as { toDate?: () => Date };
  const fields = normalizeFields(data.fields as ChecklistTemplateField[] | undefined);
  const version = typeof data.version === "number" ? data.version : 1;
  return {
    id,
    name: (data.name as string) ?? "",
    description: data.description as string | undefined,
    version,
    fields,
    createdAt: createdAt?.toDate?.() ?? new Date(0),
    updatedAt: updatedAt?.toDate?.() ?? new Date(0),
    createdBy: (data.createdBy as string) ?? "",
  };
}

export class ChecklistTemplateService {
  static async create(data: CreateChecklistTemplateData, userId: string): Promise<ChecklistTemplate> {
    const now = new Date();
    const payload = {
      name: data.name,
      description: data.description ?? null,
      version: 1,
      fields: data.fields,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
      createdBy: userId,
    };
    const ref = await addDoc(collection(db, COLLECTION), payload);
    return toTemplate(ref.id, { ...payload, createdAt: now, updatedAt: now });
  }

  static async update(id: string, data: UpdateChecklistTemplateData): Promise<ChecklistTemplate | null> {
    const ref = doc(db, COLLECTION, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const current = snap.data();
    const currentVersion = (typeof current.version === "number" ? current.version : 1) as number;
    const nextVersion = currentVersion + 1;
    const update: Record<string, unknown> = {
      updatedAt: Timestamp.fromDate(new Date()),
      version: nextVersion,
    };
    if (data.name !== undefined) update.name = data.name;
    if (data.description !== undefined) update.description = data.description;
    if (data.fields !== undefined) update.fields = data.fields;
    await updateDoc(ref, update as Record<string, import("firebase/firestore").FieldValue>);
    return this.getById(id);
  }

  static async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTION, id));
  }

  static async getById(id: string): Promise<ChecklistTemplate | null> {
    const snap = await getDoc(doc(db, COLLECTION, id));
    if (!snap.exists()) return null;
    return toTemplate(snap.id, snap.data());
  }

  static async list(): Promise<ChecklistTemplate[]> {
    const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => toTemplate(d.id, d.data()));
  }
}
