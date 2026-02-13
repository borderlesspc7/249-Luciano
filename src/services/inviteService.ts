import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "../lib/firebaseconfig";

const INVITES_COLLECTION = "invites";

export interface Invite {
  id: string;
  email: string;
  role: "admin" | "user";
  token: string;
  createdBy: string;
  createdAt: Date;
  usedAt: Date | null;
}

export interface CreateInviteData {
  email: string;
  role: "admin" | "user";
}

function randomToken(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export class InviteService {
  static async createInvite(
    data: CreateInviteData,
    createdBy: string
  ): Promise<Invite> {
    const token = randomToken();
    const now = new Date();
    const inviteData = {
      email: data.email.trim().toLowerCase(),
      role: data.role,
      token,
      createdBy,
      createdAt: Timestamp.fromDate(now),
      usedAt: null,
    };
    const docRef = await addDoc(
      collection(db, INVITES_COLLECTION),
      inviteData
    );
    return {
      id: docRef.id,
      ...data,
      email: data.email.trim().toLowerCase(),
      token,
      createdBy,
      createdAt: now,
      usedAt: null,
    };
  }

  static async getInvites(): Promise<Invite[]> {
    const q = query(
      collection(db, INVITES_COLLECTION),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        email: data.email,
        role: data.role,
        token: data.token,
        createdBy: data.createdBy,
        createdAt: data.createdAt?.toDate?.() ?? new Date(),
        usedAt: data.usedAt?.toDate?.() ?? null,
      };
    });
  }

  static async getInviteByToken(token: string): Promise<Invite | null> {
    const q = query(
      collection(db, INVITES_COLLECTION),
      where("token", "==", token),
      where("usedAt", "==", null)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const d = snapshot.docs[0];
    const data = d.data();
    return {
      id: d.id,
      email: data.email,
      role: data.role,
      token: data.token,
      createdBy: data.createdBy,
      createdAt: data.createdAt?.toDate?.() ?? new Date(),
      usedAt: null,
    };
  }

  static async consumeInvite(inviteId: string): Promise<void> {
    await updateDoc(doc(db, INVITES_COLLECTION, inviteId), {
      usedAt: Timestamp.fromDate(new Date()),
    });
  }
}
