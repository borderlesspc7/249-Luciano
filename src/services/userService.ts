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
  Timestamp,
} from "firebase/firestore";
import { db } from "../lib/firebaseconfig";
import type {
  UserManagement,
  CreateUserData,
  UpdateUserData,
  UserStats,
} from "../types/userManagement";

const USERS_COLLECTION = "users";

const normalizeStatus = (
  status: unknown,
): "active" | "inactive" | "suspended" => {
  if (typeof status === "boolean") {
    return status ? "active" : "inactive";
  }

  if (typeof status === "string") {
    const normalized = status.trim().toLowerCase();
    if (normalized === "active" || normalized === "ativo") return "active";
    if (normalized === "inactive" || normalized === "inativo")
      return "inactive";
    if (normalized === "suspended" || normalized === "suspenso")
      return "suspended";
  }

  return "active";
};

export class UserService {
  // Usuários
  static async createUser(
    data: CreateUserData,
    userId: string,
  ): Promise<UserManagement> {
    const now = new Date();
    const userData: any = {
      name: data.name,
      email: data.email,
      role: data.role,
      status: "active" as const,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
      createdBy: userId,
      updatedBy: userId,
    };

    // Only add optional fields if they have values
    if (data.phone) {
      userData.phone = data.phone;
    }

    const docRef = await addDoc(collection(db, USERS_COLLECTION), userData);

    console.log(userData);

    return {
      id: docRef.id,
      ...userData,
      createdAt: now,
      updatedAt: now,
    };
  }

  static async getUsers(): Promise<UserManagement[]> {
    const q = query(
      collection(db, USERS_COLLECTION),
      orderBy("createdAt", "desc"),
    );

    const querySnapshot = await getDocs(q);
    const users: UserManagement[] = [];

    for (const docSnapshot of querySnapshot.docs) {
      const data = docSnapshot.data();
      const user: UserManagement = {
        id: docSnapshot.id,
        name: data.name,
        email: data.email,
        role: data.role,
        status: normalizeStatus(data.status),
        phone: data.phone,
        lastLoginAt: data.lastLoginAt?.toDate(),
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        createdBy: data.createdBy,
        updatedBy: data.updatedBy,
      };
      users.push(user);
    }

    return users;
  }

  static async getUserById(id: string): Promise<UserManagement | null> {
    const docRef = doc(db, USERS_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    return {
      id: docSnap.id,
      name: data.name,
      email: data.email,
      role: data.role,
      status: normalizeStatus(data.status),
      phone: data.phone,
      lastLoginAt: data.lastLoginAt?.toDate(),
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
      createdBy: data.createdBy,
      updatedBy: data.updatedBy,
    };
  }

  static async updateUser(
    id: string,
    data: UpdateUserData,
    userId: string,
  ): Promise<void> {
    const docRef = doc(db, USERS_COLLECTION, id);
    const updateData: any = {
      updatedAt: Timestamp.fromDate(new Date()),
      updatedBy: userId,
    };

    // Only add fields that have values
    if (data.name !== undefined) {
      updateData.name = data.name;
    }
    if (data.email !== undefined) {
      updateData.email = data.email;
    }
    if (data.role !== undefined) {
      updateData.role = data.role;
    }
    if (data.status !== undefined) {
      updateData.status = data.status;
    }
    if (data.phone !== undefined) {
      updateData.phone = data.phone;
    }

    await updateDoc(docRef, updateData);
  }

  static async deleteUser(id: string): Promise<void> {
    const docRef = doc(db, USERS_COLLECTION, id);
    await deleteDoc(docRef);
  }

  static async getUserStats(): Promise<UserStats> {
    const users = await this.getUsers();

    const stats: UserStats = {
      totalUsers: users.length,
      activeUsers: users.filter((user) => user.status === "active").length,
      adminUsers: users.filter((user) => user.role === "admin").length,
      regularUsers: users.filter((user) => user.role === "user").length,
      recentLogins: users.filter((user) => {
        if (!user.lastLoginAt) return false;
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        return user.lastLoginAt > oneWeekAgo;
      }).length,
    };

    return stats;
  }

  static async updateUserLastLogin(userId: string): Promise<void> {
    const docRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(docRef, {
      lastLoginAt: Timestamp.fromDate(new Date()),
    });
  }

  static async getActiveUsersCount(): Promise<number> {
    const users = await this.getUsers();
    return users.filter((user) => user.status === "active").length;
  }
}
