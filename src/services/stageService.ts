import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  writeBatch,
  Timestamp,
} from "firebase/firestore";
import { db } from "../lib/firebaseconfig";
import type { Stage, CreateStageData, UpdateStageData, StageType } from "../types/stages";

const COLLECTION = "stages";

function toStage(id: string, data: Record<string, unknown>): Stage {
  const createdAt = data.createdAt as { toDate?: () => Date };
  const updatedAt = data.updatedAt as { toDate?: () => Date };
  return {
    id,
    projectId: (data.projectId as string) ?? "",
    name: (data.name as string) ?? "",
    type: (data.type as StageType) ?? "funcional",
    order: (data.order as number) ?? 0,
    createdAt: createdAt?.toDate?.() ?? new Date(0),
    updatedAt: updatedAt?.toDate?.() ?? new Date(0),
    createdBy: (data.createdBy as string) ?? "",
  };
}

export class StageService {
  static async create(data: CreateStageData, userId: string): Promise<Stage> {
    const now = new Date();
    const payload = {
      projectId: data.projectId,
      name: data.name,
      type: data.type,
      order: data.order,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
      createdBy: userId,
    };
    const ref = await addDoc(collection(db, COLLECTION), payload);
    return toStage(ref.id, { ...payload, createdAt: now, updatedAt: now });
  }

  static async update(id: string, data: UpdateStageData): Promise<void> {
    const ref = doc(db, COLLECTION, id);
    const update: Record<string, unknown> = { updatedAt: Timestamp.fromDate(new Date()) };
    if (data.name !== undefined) update.name = data.name;
    if (data.type !== undefined) update.type = data.type;
    if (data.order !== undefined) update.order = data.order;
    await updateDoc(ref, update as Record<string, import("firebase/firestore").FieldValue>);
  }

  static async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTION, id));
  }

  static async getById(id: string): Promise<Stage | null> {
    const snap = await getDoc(doc(db, COLLECTION, id));
    if (!snap.exists()) return null;
    return toStage(snap.id, snap.data());
  }

  static async listByProject(projectId: string): Promise<Stage[]> {
    const q = query(
      collection(db, COLLECTION),
      where("projectId", "==", projectId),
      orderBy("order", "asc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => toStage(d.id, d.data()));
  }

  static async reorder(_projectId: string, stageIds: string[]): Promise<void> {
    const batch = writeBatch(db);
    stageIds.forEach((id, index) => {
      batch.update(doc(db, COLLECTION, id), {
        order: index,
        updatedAt: Timestamp.fromDate(new Date()),
      });
    });
    await batch.commit();
  }
}
