export interface UserManagement {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  status: "active" | "inactive" | "suspended";
  phone?: string;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: "admin" | "user";
  phone?: string;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  role?: "admin" | "user";
  status?: "active" | "inactive" | "suspended";
  phone?: string;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  adminUsers: number;
  regularUsers: number;
  recentLogins: number;
}
