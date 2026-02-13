import { createContext, useEffect, useState, useRef } from "react";
import type { ReactNode } from "react";
import type { FirebaseError } from "firebase/app";
import getFirebaseErrorMessage from "../components/ui/ErrorMessage";
import { logger } from "../lib/logger";
import { authService } from "../services/authService";
import type {
  LoginCredentials,
  RegisterCredentials,
  User,
} from "../types/users";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
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
      if (mounted.current) {
        setUser(authUser);
        setLoading(false);
      }
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
      logger.error("Login failed", { email: credentials.email, message });
    } finally {
      setLoading(false);
    }
  };

  const register = async (credentials: RegisterCredentials): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const userData = await authService.register(credentials);
      setUser(userData);
    } catch (err) {
      const message = getFirebaseErrorMessage(err as string | FirebaseError);
      setError(message);
      setUser(null);
      logger.error("Register failed", { email: credentials.email, message });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      setError(null);
      await authService.logOut();
      setUser(null);
    } catch (err) {
      const message = getFirebaseErrorMessage(err as string | FirebaseError);
      setError(message);
      logger.error("Logout failed", { message });
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext };

