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
  const installationDate = data.installationDate as { toDate?: () => Date } | undefined;
  return {
    id,
    assetId: (data.assetId as string) ?? "",
    name: (data.name as string) ?? "",
    description: data.description as string | undefined,
    createdAt: createdAt?.toDate?.() ?? new Date(0),
    updatedAt: updatedAt?.toDate?.() ?? new Date(0),
    createdBy: (data.createdBy as string) ?? "",
    type: data.type as string | undefined,
    serialNumber: data.serialNumber as string | undefined,
    manufacturer: data.manufacturer as string | undefined,
    model: data.model as string | undefined,
    projectId: data.projectId as string | undefined,
    machineId: data.machineId as string | undefined,
    installationDate: installationDate?.toDate?.() ?? undefined,
    status: data.status as Component["status"],
    projectName: data.projectName as string | undefined,
    machineName: data.machineName as string | undefined,
  };
}

export class ComponentService {
  static async create(data: CreateComponentData, userId: string): Promise<Component> {
    const now = new Date();
    const payload: Record<string, unknown> = {
      assetId: data.assetId ?? "",
      name: data.name,
      description: data.description ?? null,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
      createdBy: userId,
    };
    if (data.type !== undefined) payload.type = data.type;
    if (data.serialNumber !== undefined) payload.serialNumber = data.serialNumber;
    if (data.manufacturer !== undefined) payload.manufacturer = data.manufacturer;
    if (data.model !== undefined) payload.model = data.model;
    if (data.projectId !== undefined) payload.projectId = data.projectId;
    if (data.machineId !== undefined) payload.machineId = data.machineId;
    if (data.installationDate !== undefined) payload.installationDate = Timestamp.fromDate(data.installationDate);
    if (data.status !== undefined) payload.status = data.status;
    const ref = await addDoc(collection(db, COLLECTION), payload);
    return toComponent(ref.id, { ...payload, createdAt: now, updatedAt: now });
  }

  static async update(id: string, data: UpdateComponentData): Promise<void> {
    const ref = doc(db, COLLECTION, id);
    const update: Record<string, unknown> = { updatedAt: Timestamp.fromDate(new Date()) };
    if (data.name !== undefined) update.name = data.name;
    if (data.description !== undefined) update.description = data.description;
    if (data.type !== undefined) update.type = data.type;
    if (data.serialNumber !== undefined) update.serialNumber = data.serialNumber;
    if (data.manufacturer !== undefined) update.manufacturer = data.manufacturer;
    if (data.model !== undefined) update.model = data.model;
    if (data.projectId !== undefined) update.projectId = data.projectId;
    if (data.machineId !== undefined) update.machineId = data.machineId;
    if (data.installationDate !== undefined) update.installationDate = Timestamp.fromDate(data.installationDate);
    if (data.status !== undefined) update.status = data.status;
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

  static async list(): Promise<Component[]> {
    const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => toComponent(d.id, d.data()));
  }

  static async getComponents(): Promise<Component[]> {
    return ComponentService.list();
  }

  static async createComponent(data: CreateComponentData, userId: string): Promise<Component> {
    return ComponentService.create(data, userId);
  }

  static async updateComponent(id: string, data: UpdateComponentData): Promise<void> {
    return ComponentService.update(id, data);
  }

  static async deleteComponent(id: string): Promise<void> {
    return ComponentService.delete(id);
  }
}
