import {
  collection,
  doc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../lib/firebaseconfig";
import type {
  UserManagement,
  UpdateUserData,
  UserStats,
} from "../types/userManagement";
import { logger } from "../lib/logger";

const USERS_COLLECTION = "users";

const normalizeStatus = (
  status: unknown
): "active" | "inactive" | "suspended" => {
  if (typeof status === "boolean") {
    return status ? "active" : "inactive";
  }
  if (typeof status === "string") {
    const n = status.trim().toLowerCase();
    if (n === "active" || n === "ativo") return "active";
    if (n === "inactive" || n === "inativo") return "inactive";
    if (n === "suspended" || n === "suspenso") return "suspended";
  }
  return "active";
};

function docToUserManagement(
  docId: string,
  data: Record<string, unknown>
): UserManagement {
  const createdAt = data.createdAt as { toDate?: () => Date } | undefined;
  const updatedAt = data.updatedAt as { toDate?: () => Date } | undefined;
  const lastLoginAt = data.lastLoginAt as { toDate?: () => Date } | undefined;
  return {
    id: docId,
    name: (data.name as string) ?? "",
    email: (data.email as string) ?? "",
    role: (data.role as "admin" | "user") ?? "user",
    status: normalizeStatus(data.status),
    phone: data.phone as string | undefined,
    lastLoginAt: lastLoginAt?.toDate?.() ?? undefined,
    createdAt: createdAt?.toDate?.() ?? new Date(0),
    updatedAt: updatedAt?.toDate?.() ?? new Date(0),
    createdBy: (data.createdBy as string) ?? "",
    updatedBy: (data.updatedBy as string) ?? "",
  };
}

/**
 * Lista todos os documentos da coleção users.
 * Perfil (doc id = uid): usuário com login. Legado (doc id aleatório): docs antigos sem Auth.
 */
export class UserService {
  static async getUsers(): Promise<UserManagement[]> {
    try {
      const snapshot = await getDocs(collection(db, USERS_COLLECTION));
      const users: UserManagement[] = [];
      snapshot.docs.forEach((d) => {
        try {
          users.push(docToUserManagement(d.id, d.data()));
        } catch (e) {
          logger.error("Invalid user doc skipped", { id: d.id, error: String(e) });
        }
      });
      users.sort(
        (a, b) =>
          b.createdAt.getTime() - a.createdAt.getTime()
      );
      return users;
    } catch (error) {
      logger.error("getUsers failed", { error: String(error) });
      throw error;
    }
  }

  static async getUserById(id: string): Promise<UserManagement | null> {
    const snap = await getDoc(doc(db, USERS_COLLECTION, id));
    if (!snap.exists()) return null;
    return docToUserManagement(snap.id, snap.data());
  }

  /**
   * Atualiza o documento users/{uid}. Apenas para perfis (doc id = uid).
   * Regras Firestore permitem apenas escrita no próprio doc.
   */
  static async updateUser(
    uid: string,
    data: UpdateUserData,
    _actingUserId: string
  ): Promise<void> {
    const ref = doc(db, USERS_COLLECTION, uid);
    const updateData: {
      updatedAt: ReturnType<typeof Timestamp.fromDate>;
      name?: string;
      email?: string;
      role?: "admin" | "user";
      status?: string;
      phone?: string;
    } = {
      updatedAt: Timestamp.fromDate(new Date()),
    };
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.phone !== undefined) updateData.phone = data.phone;
    await updateDoc(ref, updateData);
  }

  /**
   * Remove users/{uid}. Regras permitem apenas se request.auth.uid == uid (excluir própria conta).
   */
  static async deleteUser(uid: string): Promise<void> {
    await deleteDoc(doc(db, USERS_COLLECTION, uid));
  }

  static async getUserStats(): Promise<UserStats> {
    const users = await this.getUsers();
    return {
      totalUsers: users.length,
      activeUsers: users.filter((u) => u.status === "active").length,
      adminUsers: users.filter((u) => u.role === "admin").length,
      regularUsers: users.filter((u) => u.role === "user").length,
      recentLogins: users.filter((u) => {
        if (!u.lastLoginAt) return false;
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return u.lastLoginAt > weekAgo;
      }).length,
    };
  }

  static async updateUserLastLogin(userId: string): Promise<void> {
    await updateDoc(doc(db, USERS_COLLECTION, userId), {
      lastLoginAt: Timestamp.fromDate(new Date()),
    });
  }

  static async getActiveUsersCount(): Promise<number> {
    const users = await this.getUsers();
    return users.filter((u) => u.status === "active").length;
  }
}
