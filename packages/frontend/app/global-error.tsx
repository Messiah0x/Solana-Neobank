'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ background: '#0A0A0A', color: '#F5F0E8', fontFamily: 'system-ui, sans-serif' }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            padding: '24px',
            textAlign: 'center',
          }}
        >
          <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Something went wrong</h1>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '14px', maxWidth: '420px' }}>
            An unexpected error occurred. Your funds are safe — this is a display issue, not a
            wallet issue.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: '8px',
              padding: '10px 24px',
              borderRadius: '12px',
              border: 'none',
              background: '#D4AF7F',
              color: '#0A0A0A',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
