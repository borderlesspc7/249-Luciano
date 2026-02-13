import { BrowserRouter, Routes, Route } from "react-router-dom";
import { paths } from "./paths";
import { ProtectedRoute } from "./ProtectedRoutes";
import { LoginPage } from "../pages/Login/Login";
import { RegisterPage } from "../pages/Register/Register";
import { MachinesPage } from "../pages/Machines/Machines";
import { UsersPage } from "../pages/Users/Users";
import { ProjectsPage } from "../pages/Projects/Projects";
import { ComponentsPage } from "../pages/Components/Components";
import { CommissioningPage } from "../pages/Commissioning/Commissioning";
import { AuditPage } from "../pages/Audit/Audit";
import { Layout } from "../components/Layout/Layout";
import { DashboardPage } from "../pages/Dashboard/Dashboard";
import { ForgotPasswordPage } from "../pages/ForgotPassword/ForgotPassword";
import { ResetPasswordPage } from "../pages/ResetPassword/ResetPassword";
import { CodeVerification } from "../pages/CodeVerification/CodeVerification";

export const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={paths.home} element={<LoginPage />} />
        <Route path={paths.login} element={<LoginPage />} />
        <Route path={paths.register} element={<RegisterPage />} />

        <Route path={paths.forgotPassword} element={<ForgotPasswordPage />} />

        {/*fazer rota autenticada(reset password)  */}
        <Route path={paths.resetPassword} element={<ResetPasswordPage />} />

        <Route path={paths.codeVerification} element={<CodeVerification />} />

        <Route
          path={paths.menu}
          element={
            <ProtectedRoute>
              <Layout>
                <DashboardPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path={paths.machines}
          element={
            <ProtectedRoute>
              <Layout>
                <MachinesPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path={paths.users}
          element={
            <ProtectedRoute>
              <Layout>
                <UsersPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path={paths.projects}
          element={
            <ProtectedRoute>
              <Layout>
                <ProjectsPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path={paths.components}
          element={
            <ProtectedRoute>
              <Layout>
                <ComponentsPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path={paths.commissioning}
          element={
            <ProtectedRoute>
              <Layout>
                <CommissioningPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path={paths.audit}
          element={
            <ProtectedRoute>
              <Layout>
                <AuditPage />
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};
