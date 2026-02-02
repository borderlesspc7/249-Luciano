import { Button, Card, Input } from "../../components";
import {
  CardContent,
  CardDescription,
  CardHeader,
} from "../../components/ui/Card/Card";
import logo from "../../assets/logo.svg";
import { useState } from "react";
import type { ForgotPasswordType } from "../../types/users";

import "./forgotPassword.css";
import { paths } from "../../routes/paths";
import { useNavigate } from "react-router";

export const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  //   retirar apos resolver problema firebase
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [formData, setFormData] = useState<ForgotPasswordType>({
    email: "",
  });

  //   retirar apos resolver problema firebase
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // logica para enviar o email de redefinição de senha
      navigate(paths.resetPassword); //mudar para tela de confirmação do código apos implementar
    } catch (error) {
      console.error("Erro ao enviar o email de redefinição de senha:", error);
    }
  };

  return (
    <div className="forgotPassword-page">
      <div className="forgotPassword-container">
        <Card variant="default">
          <CardHeader>
            <div className="logo-section">
              <img src={logo} alt="app-logo" className="app-logo" />
              <div className="logo-text">
                <CardDescription>Esqueceu a senha ?</CardDescription>
                <p className="card-subtitle">
                  Digite seu e-mail e enviaremos um código para redefinir sua
                  senha.
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <form className="forgotPassword-form" onSubmit={handleSubmit}>
              <Input
                label="E-mail"
                type="email"
                placeholder="seu@email.com"
                // value={formData.email}
                required
              />
              <div className="form-actions">
                {/* Quando clicar em enviar, redirecionar para a tela do codigo de confirmação */}
                <Button type="submit" fullWidth disabled={loading}>
                  {loading ? "Carregando..." : "Enviar"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
