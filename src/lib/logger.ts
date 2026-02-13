/**
 * Logger central para erros. Ponto de extensão para Sentry (ex.: Sentry.captureException).
 * Sem adicionar lib externa; uso: logError("msg", { context })
 */

type ErrorContext = Record<string, unknown>;

export const logger = {
  error(message: string, context?: ErrorContext): void {
    const payload = {
      level: "error",
      message,
      timestamp: new Date().toISOString(),
      ...context,
    };
    console.error("[App Error]", payload);
    // Ponto de extensão: if (typeof window !== "undefined" && window.Sentry) window.Sentry.captureException(new Error(message), { extra: context });
  },
};

export default logger;
