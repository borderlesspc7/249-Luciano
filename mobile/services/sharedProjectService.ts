import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";

export type SharedProject = {
  id: string;
  name: string;
  createdBy: string;
  createdAt: string;
};

const COLLECTION_NAME = "sharedProjects";

export const sharedProjectService = {
  async listAll(): Promise<SharedProject[]> {
    const q = query(collection(db, COLLECTION_NAME), orderBy("name", "asc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        name: data.name ?? "",
        createdBy: data.createdBy ?? "",
        createdAt:
          data.createdAt instanceof Timestamp
            ? data.createdAt.toDate().toISOString()
            : data.createdAt ?? new Date().toISOString(),
      };
    });
  },

  async create(name: string, userId: string): Promise<SharedProject> {
    const now = Timestamp.fromDate(new Date());
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      name,
      createdBy: userId,
      createdAt: now,
    });
    return {
      id: docRef.id,
      name,
      createdBy: userId,
      createdAt: now.toDate().toISOString(),
    };
  },

  async exists(name: string): Promise<boolean> {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("name", "==", name.trim())
    );
    const snap = await getDocs(q);
    return !snap.empty;
  },
};
