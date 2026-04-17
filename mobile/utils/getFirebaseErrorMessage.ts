interface FirebaseError {
  code?: string;
  message?: string;
}

export default function getFirebaseErrorMessage(
  error: string | FirebaseError
): string {
  if (typeof error === "string") return error;
  const code = error?.code ?? "";
  switch (code) {
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
    case "auth/invalid-login-credentials":
      return "E-mail ou senha incorretos. Tente novamente.";
    case "auth/invalid-email":
      return "E-mail inválido. Verifique o formato.";
    case "auth/too-many-requests":
      return "Muitas tentativas. Tente novamente em alguns minutos.";
    case "auth/user-disabled":
      return "Conta desabilitada. Entre em contato com o suporte.";
    case "auth/network-request-failed":
      return "Sem conexão. Verifique sua internet (modo offline).";
    case "auth/invalid-api-key":
      return "Erro de configuração. Entre em contato com o suporte.";
    case "auth/missing-email":
      return "Informe seu e-mail para recuperar a senha.";
    default:
      return error?.message ?? "Erro inesperado. Tente novamente.";
  }
}
