import * as Sentry from '@sentry/nextjs';

/**
 * Next.js calls this once per server runtime. We initialise Sentry only when a
 * DSN is provided so local/dev builds stay quiet and no network calls are made.
 */
export function register() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;

  if (process.env.NEXT_RUNTIME === 'nodejs' || process.env.NEXT_RUNTIME === 'edge') {
    Sentry.init({
      dsn,
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0.1'),
      environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
      debug: false,
    });
  }
}

export const onRequestError = Sentry.captureRequestError;
