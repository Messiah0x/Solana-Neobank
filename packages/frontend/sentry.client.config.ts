import * as Sentry from '@sentry/nextjs';

// No-op unless a DSN is configured (see .env.example).
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
  tracesSampleRate: 0.1,
  // Session Replay is intentionally OFF. This is a financial UI; DOM replays
  // would capture balances, wallet addresses, and amounts. Error monitoring
  // (exceptions + traces) stays on without the replay integration, so nothing
  // records the rendered account state. If replay is ever wanted, add
  // replayIntegration({ maskAllText, maskAllInputs, blockAllMedia }) — never
  // unmasked on this app.
  replaysOnErrorSampleRate: 0,
  replaysSessionSampleRate: 0,
});
