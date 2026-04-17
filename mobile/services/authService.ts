import { auth, db } from "../lib/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  type Unsubscribe,
} from "firebase/auth";
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import type { LoginCredentials, RegisterCredentials, User } from "../types/users";
import getFirebaseErrorMessage from "../utils/getFirebaseErrorMessage";

interface FirebaseError {
  code?: string;
  message?: string;
}

export const authService = {
  async logOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      const msg = getFirebaseErrorMessage(error as string | FirebaseError);
      throw new Error(msg);
    }
  },

  async login(credentials: LoginCredentials): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );
      const firebaseUser = userCredential.user;
      const userRef = doc(db, "users", firebaseUser.uid);
      const userDoc = await getDoc(userRef);

      const now = new Date();
      let userData: User;

      if (!userDoc.exists()) {
        // Conta criada diretamente no console Firebase sem passar pelo fluxo de registro.
        // Tratamos como conta ativa com role writer por padrão.
        userData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email ?? credentials.email,
          name: firebaseUser.displayName || credentials.email.split("@")[0],
          createdAt: now,
          updatedAt: now,
          role: "writer",
          status: "active",
        };
        await setDoc(userRef, { ...userData, lastLogin: Timestamp.fromDate(now) });
      } else {
        const data = userDoc.data();
        const status = data.status ?? "active";

        if (status === "rejected") {
          await signOut(auth);
          throw new Error("Seu cadastro foi recusado pelo administrador.");
        }

        userData = {
          uid: firebaseUser.uid,
          name: data.name,
          email: data.email,
          createdAt: data.createdAt?.toDate?.() ?? now,
          updatedAt: now,
          role: data.role ?? null,
          status,
        };

        if (status === "active") {
          await setDoc(
            userRef,
            { lastLogin: Timestamp.fromDate(now), updatedAt: Timestamp.fromDate(now) },
            { merge: true }
          );
        }
      }

      return { ...userData, lastLogin: now };
    } catch (error) {
      if (error instanceof Error) throw error;
      const msg = getFirebaseErrorMessage(error as string | FirebaseError);
      throw new Error(msg);
    }
  },

  async register(credentials: RegisterCredentials): Promise<User> {
    if (!credentials.email || !credentials.password || !credentials.name) {
      throw new Error("Todos os campos são obrigatórios");
    }
    if (credentials.password.length < 6) {
      throw new Error("A senha deve ter pelo menos 6 caracteres");
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );
      const firebaseUser = userCredential.user;
      const now = new Date();
      const userData: User = {
        uid: firebaseUser.uid,
        email: credentials.email,
        name: credentials.name,
        createdAt: now,
        updatedAt: now,
        role: null,
        status: "pending",
      };
      await setDoc(doc(db, "users", firebaseUser.uid), {
        ...userData,
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
      });
      return userData;
    } catch (error) {
      if (error instanceof Error) throw error;
      const msg = getFirebaseErrorMessage(error as string | FirebaseError);
      throw new Error(msg);
    }
  },

  async sendPasswordReset(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (error) {
      const msg = getFirebaseErrorMessage(error as string | FirebaseError);
      throw new Error(msg);
    }
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
          callback(null);
          return;
        }
        const data = userDoc.data();
        const user: User = {
          uid: userDoc.id,
          name: data.name,
          email: data.email,
          createdAt: data.createdAt?.toDate?.() ?? new Date(),
          updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
          role: data.role ?? null,
          status: data.status ?? "active",
          lastLogin: data.lastLogin?.toDate?.() ?? undefined,
        };
        callback(user);
      } catch {
        callback(null);
      }
    });
  },
};
