import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import type { ReactNode } from "react";
import { paths } from "./paths";

interface ProtectedRouteProps {
  children: ReactNode;
  /** Se definido, apenas usuários com este role acessam (ex.: "admin" para /users). */
  requiredRole?: "admin" | "user";
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen" role="status" aria-label="Carregando">
        Carregando...
      </div>
    );
  }

  if (!user) return <Navigate to={paths.login} replace />;

  if (requiredRole === "admin" && user.role !== "admin") {
    return <Navigate to={paths.menu} replace />;
  }

  return <>{children}</>;
}
