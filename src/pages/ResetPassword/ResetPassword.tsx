import { Card, Input, Button } from "../../components";
import {
  CardHeader,
  CardDescription,
  CardContent,
} from "../../components/ui/Card/Card";
import logo from "../../assets/logo.svg";
import { useState } from "react";
import "./ResetPassword.css";
import { useNavigate } from "react-router-dom";
import { paths } from "../../routes/paths";

export const ResetPasswordPage = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // logica para resetar a senha
      navigate(paths.login);
    } catch (error) {
      console.error("Erro ao resetar a senha:", error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="resetPassword-page">
      <div className="resetPassword-container">
        <Card variant="default">
          <CardHeader>
            <div className="logo-section">
              <img src={logo} alt="app-logo" className="app-logo" />

              <div className="logo-text">
                <CardDescription>Criar nova senha</CardDescription>
                <p className="card-subtitle">
                  Digite sua nova senha abaixo. Ela deve ter pelo menos 6
                  caracteres.
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <form className="resetPassword-form" onSubmit={handleSubmit}>
              <Input
                label="Nova senha"
                type="password"
                placeholder="Digite sua nova senha"
                // value={formData.email}
                required
              />

              <Input
                label="Confirmar nova senha"
                type="password"
                placeholder="Confirme sua nova senha"
                // value={formData.email}
                required
              />
              <div className="form-actions">
                {/* Quando clicar em salvar, e se passar na validação, redirecionar para a tela de login */}
                <Button type="submit" fullWidth disabled={loading}>
                  {loading ? "Carregando..." : "Salvar nova senha"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
