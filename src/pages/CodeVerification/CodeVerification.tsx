import { useState } from "react";
import { Card } from "../../components";
import { CardDescription, CardHeader } from "../../components/ui/Card/Card";
import { Button } from "../../components/ui/Button/Button";
import "./CodeVerification.css";
import { useNavigate } from "react-router-dom";
import { paths } from "../../routes/paths";
import logo from "../../assets/logo.svg";

export const CodeVerification = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState<string[]>(Array(6).fill(""));

  // apenas para logica de backspace
  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  // implementar logica de verificação após resolver firebase
  const handleVerifyCode = () => {
    const fullCode = code.join("");
    console.log("Verifying code:", fullCode);

    // ver a logica de verificação\
    navigate(paths.resetPassword);
  };

  // implementar logica de retry após resolver firebase
  const handleResendCode = () => {
    console.log("Resending code...");
    // ver a lgica de reenvio
  };

  function handleCodeChange(i: number, v: string): void {
    const next = [...code];
    next[i] = v.slice(-1);
    setCode(next);
  }

  return (
    <div className="code-verification-container">
      <Card>
        <CardHeader>
          <div className="code-verification-content">
            <img src={logo} alt="app-logo" className="app-logo" />

            <CardDescription>Código de confirmação</CardDescription>
            <p className="code-verification-subtitle">
              Digite o código de 6 dígitos enviado para
            </p>

            <div className="code-inputs-wrapper">
              {code.map((digit, index) => (
                <input
                  key={index}
                  id={`code-input-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  className="code-input"
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                />
              ))}
            </div>

            <Button
              variant="primary"
              fullWidth
              size="medium"
              onClick={handleVerifyCode}
            >
              Verificar código
            </Button>

            <div className="resend-code-container">
              <span className="resend-text">Não recebeu o código?</span>
              <button className="resend-link" onClick={handleResendCode}>
                Reenviar
              </button>
            </div>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
};
