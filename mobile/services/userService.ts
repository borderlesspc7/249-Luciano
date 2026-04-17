import { db } from "../lib/firebase";
import {
  collection,
  doc,
  getDocs,
  updateDoc,
  Timestamp,
  query,
  orderBy,
} from "firebase/firestore";
import type { User, UserRole } from "../types/users";

export const userService = {
  async listUsers(): Promise<User[]> {
    const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => {
      const data = d.data();
      return {
        uid: d.id,
        name: data.name ?? "",
        email: data.email ?? "",
        role: data.role ?? null,
        status: data.status ?? "active",
        createdAt: data.createdAt?.toDate?.() ?? new Date(),
        updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
        lastLogin: data.lastLogin?.toDate?.() ?? undefined,
      } as User;
    });
  },

  async approveUser(uid: string, role: UserRole): Promise<void> {
    await updateDoc(doc(db, "users", uid), {
      status: "active",
      role,
      updatedAt: Timestamp.fromDate(new Date()),
    });
  },

  async rejectUser(uid: string): Promise<void> {
    await updateDoc(doc(db, "users", uid), {
      status: "rejected",
      updatedAt: Timestamp.fromDate(new Date()),
    });
  },

  async updateRole(uid: string, role: UserRole): Promise<void> {
    await updateDoc(doc(db, "users", uid), {
      role,
      updatedAt: Timestamp.fromDate(new Date()),
    });
  },
};
