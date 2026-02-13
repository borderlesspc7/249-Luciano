import { BrowserRouter, Routes, Route } from "react-router-dom";
import { paths } from "./paths";
import { ProtectedRoute } from "./ProtectedRoutes";
import { LoginPage } from "../pages/Login/Login";
import { RegisterPage } from "../pages/Register/Register";
import { MachinesPage } from "../pages/Machines/Machines";
import { UsersPage } from "../pages/Users/Users";
import { Layout } from "../components/Layout/Layout";
import { DashboardPage } from "../pages/Dashboard/Dashboard";
import { ForgotPasswordPage } from "../pages/ForgotPassword/ForgotPassword";
import { ResetPasswordPage } from "../pages/ResetPassword/ResetPassword";
import { CodeVerification } from "../pages/CodeVerification/CodeVerification";
import { AcceptInvitePage } from "../pages/AcceptInvite/AcceptInvite";
import { ProjectsPage } from "../pages/Projects/Projects";
import { ProjectDetailPage } from "../pages/ProjectDetail/ProjectDetail";
import { AssetDetailPage } from "../pages/AssetDetail/AssetDetail";
import { StageChecklistPage } from "../pages/StageChecklist/StageChecklist";
import { ChecklistExecutionPage } from "../pages/ChecklistExecution/ChecklistExecution";
import { ChecklistTemplatesPage } from "../pages/ChecklistTemplates/ChecklistTemplates";

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
          path="/projects/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <ProjectDetailPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:id/assets/:assetId"
          element={
            <ProtectedRoute>
              <Layout>
                <AssetDetailPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:id/stages/:stageId/checklist/:executionId"
          element={
            <ProtectedRoute>
              <Layout>
                <ChecklistExecutionPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:id/stages/:stageId/checklist"
          element={
            <ProtectedRoute>
              <Layout>
                <StageChecklistPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path={paths.adminChecklistTemplates}
          element={
            <ProtectedRoute requiredRole="admin">
              <Layout>
                <ChecklistTemplatesPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path={paths.users}
          element={
            <ProtectedRoute requiredRole="admin">
              <Layout>
                <UsersPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route path={paths.acceptInvite} element={<AcceptInvitePage />} />
      </Routes>
    </BrowserRouter>
  );
};
