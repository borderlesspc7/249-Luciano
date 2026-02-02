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

export const ForgotPasswordPage = () => {
  //   retirar apos resolver problema firebase
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [formData, setFormData] = useState<ForgotPasswordType>({
    email: "",
  });

  //   retirar apos resolver problema firebase
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, setLoading] = useState(false);

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
            <form className="forgotPassword-form">
              <Input
                label="E-mail"
                type="email"
                placeholder="seu@email.com"
                // value={formData.email}
                required
              />
            </form>

            <div className="form-actions">
              <Button type="submit" fullWidth disabled={loading}>
                {loading ? "Carregando..." : "Enviar"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
