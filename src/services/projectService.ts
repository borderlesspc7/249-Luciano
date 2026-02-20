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
  where,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { db } from "../lib/firebaseconfig";
import type { Project, CreateProjectData, UpdateProjectData } from "../types/projects";

const COLLECTION = "projects";

function toProject(id: string, data: Record<string, unknown>): Project {
  const createdAt = data.createdAt as { toDate?: () => Date };
  const updatedAt = data.updatedAt as { toDate?: () => Date };
  const startDate = data.startDate as { toDate?: () => Date } | undefined;
  const expectedEndDate = data.expectedEndDate as { toDate?: () => Date } | undefined;
  const endDate = data.endDate as { toDate?: () => Date } | undefined;
  return {
    id,
    name: (data.name as string) ?? "",
    description: data.description as string | undefined,
    status: (data.status as Project["status"]) ?? "active",
    createdAt: createdAt?.toDate?.() ?? new Date(0),
    updatedAt: updatedAt?.toDate?.() ?? new Date(0),
    createdBy: (data.createdBy as string) ?? "",
    startDate: startDate?.toDate?.() ?? undefined,
    expectedEndDate: expectedEndDate?.toDate?.() ?? undefined,
    endDate: endDate?.toDate?.() ?? undefined,
    managerId: data.managerId as string | undefined,
    managerName: data.managerName as string | undefined,
  };
}

export class ProjectService {
  static async create(data: CreateProjectData, userId: string): Promise<Project> {
    const now = new Date();
    const payload: Record<string, unknown> = {
      name: data.name,
      description: data.description ?? null,
      status: data.status ?? "active",
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
      createdBy: userId,
    };
    if (data.startDate) payload.startDate = Timestamp.fromDate(data.startDate);
    if (data.expectedEndDate) payload.expectedEndDate = Timestamp.fromDate(data.expectedEndDate);
    if (data.managerId) payload.managerId = data.managerId;
    const ref = await addDoc(collection(db, COLLECTION), payload);
    return toProject(ref.id, { ...payload, createdAt: now, updatedAt: now });
  }

  static async update(id: string, data: UpdateProjectData, _userId: string): Promise<void> {
    const ref = doc(db, COLLECTION, id);
    const update: Record<string, unknown> = {
      updatedAt: Timestamp.fromDate(new Date()),
    };
    if (data.name !== undefined) update.name = data.name;
    if (data.description !== undefined) update.description = data.description;
    if (data.status !== undefined) update.status = data.status;
    if (data.startDate !== undefined) update.startDate = Timestamp.fromDate(data.startDate);
    if (data.expectedEndDate !== undefined) update.expectedEndDate = Timestamp.fromDate(data.expectedEndDate);
    if (data.endDate !== undefined) update.endDate = Timestamp.fromDate(data.endDate);
    if (data.managerId !== undefined) update.managerId = data.managerId;
    await updateDoc(ref, update as Record<string, import("firebase/firestore").FieldValue>);
  }

  static async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTION, id));
  }

  static async getById(id: string): Promise<Project | null> {
    const snap = await getDoc(doc(db, COLLECTION, id));
    if (!snap.exists()) return null;
    return toProject(snap.id, snap.data());
  }

  static async list(filters?: { status?: Project["status"] }): Promise<Project[]> {
    let q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));
    if (filters?.status) {
      q = query(collection(db, COLLECTION), where("status", "==", filters.status), orderBy("createdAt", "desc"));
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => toProject(d.id, d.data()));
  }

  static subscribeToList(
    onData: (projects: Project[]) => void,
    filters?: { status?: Project["status"] }
  ): () => void {
    let q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));
    if (filters?.status) {
      q = query(collection(db, COLLECTION), where("status", "==", filters.status), orderBy("createdAt", "desc"));
    }
    return onSnapshot(q, (snapshot) => {
      onData(snapshot.docs.map((d) => toProject(d.id, d.data())));
    });
  }

  static async getProjects(filters?: { status?: Project["status"] }): Promise<Project[]> {
    return ProjectService.list(filters);
  }
}
