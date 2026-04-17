import {
  collection,
  addDoc,
  doc,
  getDocs,
  query,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import type { ChecklistFolder } from "../contexts/ChecklistFoldersContext";

const COLLECTION_NAME = "checklistFolders";

type ChecklistFolderCreateInput = Omit<ChecklistFolder, "id" | "createdAt" | "updatedAt" | "userId">;

export const checklistFolderService = {
  async listAll(): Promise<ChecklistFolder[]> {
    const q = query(collection(db, COLLECTION_NAME));
    const snap = await getDocs(q);

    const items = snap.docs.map((snapshot) => {
      const data = snapshot.data() as any;

      return {
        id: snapshot.id,
        userId: data.userId,
        projectName: data.projectName,
        areaName: data.areaName,
        name: data.name,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      } as ChecklistFolder;
    });

    return items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  async create(userId: string, item: ChecklistFolderCreateInput): Promise<ChecklistFolder> {
    const nowIso = new Date().toISOString();

    const payload = {
      ...item,
      userId,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), payload);

    return {
      ...payload,
      id: docRef.id,
    };
  },

  async delete(id: string): Promise<void> {
    const ref = doc(db, COLLECTION_NAME, id);
    await deleteDoc(ref);
  },
};

