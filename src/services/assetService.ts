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
import type { Asset, CreateAssetData, UpdateAssetData } from "../types/assets";

const COLLECTION = "assets";

function toAsset(id: string, data: Record<string, unknown>): Asset {
  const createdAt = data.createdAt as { toDate?: () => Date };
  const updatedAt = data.updatedAt as { toDate?: () => Date };
  return {
    id,
    projectId: (data.projectId as string) ?? "",
    name: (data.name as string) ?? "",
    description: data.description as string | undefined,
    type: data.type as string | undefined,
    createdAt: createdAt?.toDate?.() ?? new Date(0),
    updatedAt: updatedAt?.toDate?.() ?? new Date(0),
    createdBy: (data.createdBy as string) ?? "",
  };
}

export class AssetService {
  static async create(data: CreateAssetData, userId: string): Promise<Asset> {
    const now = new Date();
    const payload = {
      projectId: data.projectId,
      name: data.name,
      description: data.description ?? null,
      type: data.type ?? null,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
      createdBy: userId,
    };
    const ref = await addDoc(collection(db, COLLECTION), payload);
    return toAsset(ref.id, { ...payload, createdAt: now, updatedAt: now });
  }

  static async update(id: string, data: UpdateAssetData): Promise<void> {
    const ref = doc(db, COLLECTION, id);
    const update: Record<string, unknown> = { updatedAt: Timestamp.fromDate(new Date()) };
    if (data.name !== undefined) update.name = data.name;
    if (data.description !== undefined) update.description = data.description;
    if (data.type !== undefined) update.type = data.type;
    await updateDoc(ref, update as Record<string, import("firebase/firestore").FieldValue>);
  }

  static async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTION, id));
  }

  static async getById(id: string): Promise<Asset | null> {
    const snap = await getDoc(doc(db, COLLECTION, id));
    if (!snap.exists()) return null;
    return toAsset(snap.id, snap.data());
  }

  static async listByProject(projectId: string): Promise<Asset[]> {
    const q = query(
      collection(db, COLLECTION),
      where("projectId", "==", projectId),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => toAsset(d.id, d.data()));
  }

  static async listAll(): Promise<Asset[]> {
    const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => toAsset(d.id, d.data()));
  }
}
