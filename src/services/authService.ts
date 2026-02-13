import { auth, db } from "../lib/firebaseconfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  type Unsubscribe,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc, getDoc, Timestamp } from "firebase/firestore";
import type {
  LoginCredentials,
  RegisterCredentials,
  User,
} from "../types/users";
import getFirebaseErrorMessage from "../components/ui/ErrorMessage";
import { logger } from "../lib/logger";
import { InviteService } from "./inviteService";

interface FirebaseError {
  code?: string;
  message?: string;
}

export const authService = {
  async logOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      const message = getFirebaseErrorMessage(error as string | FirebaseError);
      throw new Error(message);
    }
  },

  async login(credentials: LoginCredentials): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password,
      );

      const firebaseUser = userCredential.user;

      const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));

      if (!userDoc.exists()) {
        throw new Error("User not found");
      }

      const userData = userDoc.data() as User;

      const lastLogin = new Date();
      await setDoc(
        doc(db, "users", firebaseUser.uid),
        { ...userData, lastLogin: Timestamp.fromDate(lastLogin) },
        { merge: true }
      );
      return { ...userData, lastLogin } as User;
    } catch (error) {
      const message = getFirebaseErrorMessage(error as string | FirebaseError);
      logger.error("Login failed", { email: credentials.email, message });
      throw new Error(message);
    }
  },

  async register(credentials: RegisterCredentials): Promise<User> {
    try {
      // Validação dos campos obrigatórios
      if (!credentials.email || !credentials.password || !credentials.name) {
        throw new Error("Todos os campos são obrigatórios");
      }

      if (credentials.password.length < 6) {
        throw new Error("A senha deve ter pelo menos 6 caracteres");
      }

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password,
      );

      const firebaseUser = userCredential.user;

      const userData: User = {
        uid: firebaseUser.uid,
        email: credentials.email,
        name: credentials.name,
        createdAt: new Date(),
        updatedAt: new Date(),
        role: credentials.role || "user", // Role padrão se não especificado
      };

      await setDoc(doc(db, "users", firebaseUser.uid), userData);
      return userData;
    } catch (error) {
      const message = getFirebaseErrorMessage(error as string | FirebaseError);
      logger.error("Register failed", { email: credentials.email, message });
      throw new Error(message);
    }
  },

  async acceptInvite(
    token: string,
    name: string,
    password: string
  ): Promise<User> {
    const invite = await InviteService.getInviteByToken(token);
    if (!invite) throw new Error("Convite inválido ou já utilizado.");
    if (password.length < 6) throw new Error("A senha deve ter pelo menos 6 caracteres.");
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      invite.email,
      password
    );
    const uid = userCredential.user.uid;
    const now = new Date();
    const userData: User = {
      uid,
      email: invite.email,
      name: name.trim(),
      createdAt: now,
      updatedAt: now,
      role: invite.role,
    };
    await setDoc(doc(db, "users", uid), {
      ...userData,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
      status: "active",
    });
    await InviteService.consumeInvite(invite.id);
    return userData;
  },

  observeAuthState(callback: (user: User | null) => void): Unsubscribe {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        callback(null);
        return;
      }
      try {
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        if (!userDoc.exists()) {
          logger.error("User profile not found in Firestore", {
            uid: firebaseUser.uid,
          });
          callback(null);
          return;
        }
        const data = userDoc.data();
        const userData: User = {
          uid: userDoc.id,
          name: data.name,
          email: data.email,
          createdAt: data.createdAt?.toDate?.() ?? new Date(),
          updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
          role: data.role ?? "user",
        };
        callback(userData);
      } catch (error) {
        logger.error("Failed to load user profile", {
          uid: firebaseUser.uid,
          error: String(error),
        });
        callback(null);
      }
    });
  },
};
