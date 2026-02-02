"use client";

import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardDescription,
  CardContent,
} from "../../components/ui/Card/Card";
import { Button } from "../../components/ui/Button/Button";
import { Input } from "../../components/ui/Input/Input";
import { useNavigate, Link } from "react-router-dom";
import { paths } from "../../routes/paths";
import { useAuth } from "../../hooks/useAuth";
import logo from "../../assets/logo.svg";
import "./Login.css";

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login, error, loading } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(formData);
      navigate(paths.menu);
    } catch (error) {
      console.error("Erro ao fazer login:", error);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <Card variant="elevated">
          <CardHeader>
            <div className="logo-section">
              <img src={logo} alt="Logo" className="app-logo" />
              <div className="logo-text">
                <CardDescription>Faça login para continuar</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <form className="login-form" onSubmit={handleSubmit}>
              <Input
                label="E-mail"
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={(value) => handleInputChange("email", value)}
                required
              />
              <Input
                label="Senha"
                type="password"
                placeholder="********"
                value={formData.password}
                onChange={(value) => handleInputChange("password", value)}
                required
              />
              <div className="form-actions">
                <Button fullWidth type="submit" disabled={loading}>
                  {loading ? "Carregando..." : "Entrar"}
                </Button>
                {error && <div className="status-message error">{error}</div>}

                <div className="forgot-password-link">
                  <Link to={paths.forgotPassword}>Esqueci minha senha</Link>
                </div>

                <div className="register-link">
                  <Link to={paths.register}>
                    Não tem uma conta? Cadastre-se
                  </Link>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
