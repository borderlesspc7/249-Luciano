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
import "./Register.css";

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, error, loading } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("As senhas não coincidem");
      return;
    }
    try {
      await register(formData);
      navigate(paths.menu);
    } catch (error) {
      console.error("Erro ao fazer registro:", error);
    }
  };

  return (
    <div className="registro-page">
      <div className="registro-container">
        <Card variant="elevated">
          <CardHeader>
            <div className="logo-section">
              <img src={logo} alt="Logo" className="app-logo" />
              <div className="logo-text">
                <CardDescription>Crie sua conta para continuar</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <form className="registro-form" onSubmit={handleSubmit}>
              <Input
                label="Nome Completo"
                type="text"
                placeholder="Digite seu nome completo"
                value={formData.name}
                onChange={(value) => handleInputChange("name", value)}
                required
              />
              <Input
                label="E-mail"
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={(value) => handleInputChange("email", value)}
                required
              />
              <Input
                label="Telefone"
                type="tel"
                placeholder="(00) 00000-0000"
                value={formData.phone}
                onChange={(value) => handleInputChange("phone", value)}
              />
              <Input
                label="Senha"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={formData.password}
                onChange={(value) => handleInputChange("password", value)}
                required
              />
              <Input
                label="Confirmar senha"
                type="password"
                placeholder="Digite a senha novamente"
                value={formData.confirmPassword}
                onChange={(value) =>
                  handleInputChange("confirmPassword", value)
                }
                required
              />

              <div className="form-actions">
                <Button fullWidth type="submit" disabled={loading}>
                  {loading ? "Criando conta..." : "Criar conta"}
                </Button>

                {error && <div className="status-message error">{error}</div>}

                <div className="login-link">
                  <Link to={paths.login}>Já tem uma conta? Faça login</Link>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
