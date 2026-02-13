import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { authService } from "../../services/authService";
import { InviteService } from "../../services/inviteService";
import { paths } from "../../routes/paths";
import { Card, CardHeader, CardDescription, CardContent } from "../../components/ui/Card/Card";
import { Button } from "../../components/ui/Button/Button";
import { Input } from "../../components/ui/Input/Input";
import { logger } from "../../lib/logger";
import "./AcceptInvite.css";

export const AcceptInvitePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") ?? "";
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [inviteEmail, setInviteEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError("Link de convite inválido.");
      return;
    }
    InviteService.getInviteByToken(token)
      .then((invite) => {
        if (invite) setInviteEmail(invite.email);
        else setError("Convite inválido ou já utilizado.");
      })
      .catch((e) => {
        logger.error("Failed to load invite", { token: token.slice(0, 8), error: String(e) });
        setError("Erro ao carregar convite.");
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Nome é obrigatório.");
      return;
    }
    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    setSubmitting(true);
    try {
      await authService.acceptInvite(token, name.trim(), password);
      navigate(paths.menu, { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao ativar conta.";
      setError(message);
      logger.error("Accept invite failed", { email: inviteEmail, message });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="accept-invite-page">
        <div className="accept-invite-container">
          <p>Carregando convite...</p>
        </div>
      </div>
    );
  }

  if (!token || !inviteEmail) {
    return (
      <div className="accept-invite-page">
        <div className="accept-invite-container">
          <Card variant="elevated">
            <CardHeader>
              <CardDescription>Convite inválido</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="accept-invite-error">
                Link de convite inválido ou já utilizado.
              </p>
              <Button variant="secondary" onClick={() => navigate(paths.login)}>
                Ir para login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="accept-invite-page">
      <div className="accept-invite-container">
        <Card variant="elevated">
          <CardHeader>
            <CardDescription>Ativar sua conta</CardDescription>
            <p className="accept-invite-email">{inviteEmail}</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="accept-invite-form">
              <Input
                label="Nome completo"
                type="text"
                value={name}
                onChange={(v) => setName(v)}
                placeholder="Seu nome"
                disabled={submitting}
                required
              />
              <Input
                label="Senha"
                type="password"
                value={password}
                onChange={(v) => setPassword(v)}
                placeholder="Mínimo 6 caracteres"
                disabled={submitting}
                required
              />
              <Input
                label="Confirmar senha"
                type="password"
                value={confirmPassword}
                onChange={(v) => setConfirmPassword(v)}
                placeholder="Repita a senha"
                disabled={submitting}
                required
              />
              {error && <p className="accept-invite-error">{error}</p>}
              <Button type="submit" disabled={submitting}>
                {submitting ? "Criando conta..." : "Criar conta"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
