export type UserRole = "reader" | "writer" | "master";
export type UserStatus = "pending" | "active" | "rejected";

export interface User {
  uid: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  role: UserRole | null;
  status: UserStatus;
  lastLogin?: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  name: string;
  confirmPassword?: string;
  phone?: string;
}
