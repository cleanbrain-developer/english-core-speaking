/**
 * Zero-dependency structured error logging. There is no error-tracking
 * service (Sentry etc.) or log aggregator (Loki etc.) wired up for this
 * app -- container stdout/stderr, read via `kubectl logs`, is the only
 * place errors surface. Emitting one JSON object per line (instead of
 * `console.error`'s free-form multi-line output) makes those logs
 * greppable/parseable, e.g.:
 *   kubectl logs deploy/api -n cleanbrain-me-english-core-speaking | grep '"level":"error"'
 */
export interface ErrorLogContext {
  method?: string;
  url?: string;
  status?: number;
  userId?: string;
}

export function logError(context: ErrorLogContext, exception: unknown): void {
  const err = exception instanceof Error ? exception : undefined;

  const entry = {
    timestamp: new Date().toISOString(),
    level: 'error',
    ...context,
    errorName: err?.name ?? 'UnknownError',
    errorMessage: err?.message ?? String(exception),
    stack: err?.stack,
  };

  // eslint-disable-next-line no-console
  console.error(JSON.stringify(entry));
}
