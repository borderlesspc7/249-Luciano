import { BrowserRouter, Routes, Route } from "react-router-dom";
import { paths } from "./paths";
import { ProtectedRoute } from "./ProtectedRoutes";
import { LoginPage } from "../pages/Login/Login";
import { RegisterPage } from "../pages/Register/Register";
import { MachinesPage } from "../pages/Machines/Machines";

export const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={paths.home} element={<LoginPage />} />
        <Route path={paths.login} element={<LoginPage />} />
        <Route path={paths.register} element={<RegisterPage />} />
        <Route
          path={paths.menu}
          element={
            <ProtectedRoute>
              <MachinesPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};
