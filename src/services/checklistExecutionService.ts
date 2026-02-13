import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import type { CreateChecklistExecutionData, UpdateChecklistExecutionData } from "../types/checklistExecutions";
import { db } from "../lib/firebaseconfig";
import type {
  ChecklistExecution,
  ChecklistExecutionStatus,
  AuditTrailEntry,
} from "../types/checklistExecutions";
const COLLECTION = "checklistExecutions";

function toDate(v: unknown): Date {
  if (v && typeof v === "object" && "toDate" in v && typeof (v as { toDate: () => Date }).toDate === "function") {
    return (v as { toDate: () => Date }).toDate();
  }
  return new Date(0);
}

function toExecution(id: string, data: Record<string, unknown>): ChecklistExecution {
  const auditTrail = (data.auditTrail as AuditTrailEntry[] | undefined) ?? [];
  return {
    id,
    templateId: (data.templateId as string) ?? "",
    templateVersion: data.templateVersion as number | undefined,
    projectId: (data.projectId as string) ?? "",
    assetId: data.assetId as string | undefined,
    stageId: (data.stageId as string) ?? "",
    status: (data.status as ChecklistExecutionStatus) ?? "draft",
    responses: (data.responses as Record<string, string | number | boolean>) ?? {},
    createdBy: (data.createdBy as string) ?? "",
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
    submittedAt: data.submittedAt ? toDate(data.submittedAt) : undefined,
    approvedAt: data.approvedAt ? toDate(data.approvedAt) : undefined,
    auditTrail: auditTrail.map((e) => ({
      ...e,
      timestamp: e.timestamp instanceof Date ? e.timestamp : toDate((e as { timestamp: unknown }).timestamp),
    })),
  };
}

export class ChecklistExecutionService {
  static async create(data: CreateChecklistExecutionData): Promise<ChecklistExecution> {
    const now = new Date();
    const payload = {
      templateId: data.templateId,
      templateVersion: data.templateVersion ?? null,
      projectId: data.projectId,
      assetId: data.assetId ?? null,
      stageId: data.stageId,
      status: "draft" as const,
      responses: {},
      createdBy: data.createdBy,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
      auditTrail: [
        {
          userId: data.createdBy,
          action: "created",
          timestamp: Timestamp.fromDate(now),
        },
      ],
    };
    const ref = await addDoc(collection(db, COLLECTION), payload);
    return toExecution(ref.id, { ...payload, createdAt: now, updatedAt: now });
  }

  static async update(
    id: string,
    data: UpdateChecklistExecutionData,
    userId: string,
    audit: { action: string; previousStatus?: ChecklistExecutionStatus; changedFields?: string[] }
  ): Promise<void> {
    const ref = doc(db, COLLECTION, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error("Execution not found");
    const current = snap.data();
    const status = current.status as ChecklistExecutionStatus;
    if (status !== "draft") {
      throw new Error("Só é possível editar checklist em rascunho.");
    }
    const now = new Date();
    const auditEntry = {
      userId,
      action: audit.action,
      timestamp: Timestamp.fromDate(now),
      previousStatus: audit.previousStatus,
      changedFields: audit.changedFields,
    };
    const auditTrail = [...((current.auditTrail as AuditTrailEntry[]) ?? []), auditEntry];
    const update: Record<string, unknown> = {
      updatedAt: Timestamp.fromDate(now),
      auditTrail,
    };
    if (data.responses !== undefined) update.responses = data.responses;
    if (data.status !== undefined) {
      update.status = data.status;
      if (data.status === "submitted") update.submittedAt = Timestamp.fromDate(now);
      if (data.status === "approved") update.approvedAt = Timestamp.fromDate(now);
    }
    await updateDoc(ref, update as Record<string, import("firebase/firestore").FieldValue>);
  }

  static async getById(id: string): Promise<ChecklistExecution | null> {
    const snap = await getDoc(doc(db, COLLECTION, id));
    if (!snap.exists()) return null;
    return toExecution(snap.id, snap.data());
  }

  static async listByStage(stageId: string): Promise<ChecklistExecution[]> {
    const q = query(
      collection(db, COLLECTION),
      where("stageId", "==", stageId),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => toExecution(d.id, d.data()));
  }

  static async listByProject(projectId: string): Promise<ChecklistExecution[]> {
    const q = query(
      collection(db, COLLECTION),
      where("projectId", "==", projectId),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => toExecution(d.id, d.data()));
  }
}
