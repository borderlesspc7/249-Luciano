import { createContext, useEffect, useState, useRef, type ReactNode } from "react";
import { authService } from "../services/authService";
import type { LoginCredentials, RegisterCredentials, User } from "../types/users";
import getFirebaseErrorMessage from "../utils/getFirebaseErrorMessage";

interface FirebaseError {
  code?: string;
  message?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const unsubscribe = authService.observeAuthState((authUser) => {
      if (mounted.current) setUser(authUser);
      if (mounted.current) setLoading(false);
    });
    return () => {
      mounted.current = false;
      unsubscribe();
    };
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      setLoading(true);
      setError(null);
      const userData = await authService.login(credentials);
      setUser(userData);
    } catch (err) {
      const message = getFirebaseErrorMessage(err as string | FirebaseError);
      setError(message);
      setUser(null);
      throw err; // rethrow para a tela de login não navegar em caso de falha
    } finally {
      setLoading(false);
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    try {
      setLoading(true);
      setError(null);
      const userData = await authService.register(credentials);
      setUser(userData);
    } catch (err) {
      const message = getFirebaseErrorMessage(err as string | FirebaseError);
      setError(message);
      setUser(null);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await authService.logOut();
      setUser(null);
      setError(null);
    } catch (err) {
      const message = getFirebaseErrorMessage(err as string | FirebaseError);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const sendPasswordReset = async (email: string) => {
    try {
      setLoading(true);
      setError(null);
      await authService.sendPasswordReset(email);
    } catch (err) {
      const message = getFirebaseErrorMessage(err as string | FirebaseError);
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        sendPasswordReset,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext };
