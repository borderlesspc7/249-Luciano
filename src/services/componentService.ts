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
  Timestamp,
} from "firebase/firestore";
import { db } from "../lib/firebaseconfig";
import type { Component, CreateComponentData, UpdateComponentData } from "../types/components";

const COLLECTION = "components";

function toComponent(id: string, data: Record<string, unknown>): Component {
  const createdAt = data.createdAt as { toDate?: () => Date };
  const updatedAt = data.updatedAt as { toDate?: () => Date };
  return {
    id,
    assetId: (data.assetId as string) ?? "",
    name: (data.name as string) ?? "",
    description: data.description as string | undefined,
    createdAt: createdAt?.toDate?.() ?? new Date(0),
    updatedAt: updatedAt?.toDate?.() ?? new Date(0),
    createdBy: (data.createdBy as string) ?? "",
  };
}

export class ComponentService {
  static async create(data: CreateComponentData, userId: string): Promise<Component> {
    const now = new Date();
    const payload = {
      assetId: data.assetId,
      name: data.name,
      description: data.description ?? null,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
      createdBy: userId,
    };
    const ref = await addDoc(collection(db, COLLECTION), payload);
    return toComponent(ref.id, { ...payload, createdAt: now, updatedAt: now });
  }

  static async update(id: string, data: UpdateComponentData): Promise<void> {
    const ref = doc(db, COLLECTION, id);
    const update: Record<string, unknown> = { updatedAt: Timestamp.fromDate(new Date()) };
    if (data.name !== undefined) update.name = data.name;
    if (data.description !== undefined) update.description = data.description;
    await updateDoc(ref, update as Record<string, import("firebase/firestore").FieldValue>);
  }

  static async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTION, id));
  }

  static async getById(id: string): Promise<Component | null> {
    const snap = await getDoc(doc(db, COLLECTION, id));
    if (!snap.exists()) return null;
    return toComponent(snap.id, snap.data());
  }

  static async listByAsset(assetId: string): Promise<Component[]> {
    const q = query(
      collection(db, COLLECTION),
      where("assetId", "==", assetId),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => toComponent(d.id, d.data()));
  }
}
