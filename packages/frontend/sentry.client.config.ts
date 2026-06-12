import * as Sentry from '@sentry/nextjs';

// No-op unless a DSN is configured (see .env.example).
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
  tracesSampleRate: 0.1,
  replaysOnErrorSampleRate: 0.1,
  replaysSessionSampleRate: 0,
});
