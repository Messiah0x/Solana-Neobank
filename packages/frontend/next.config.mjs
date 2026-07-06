import { withSentryConfig } from '@sentry/nextjs';

// Backend origin used by the same-origin API proxy (see rewrites below).
// Falls back to localhost for local dev.
const BACKEND_ORIGIN = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
          // A deliberately narrow CSP: it locks down the directives that can't
          // break third-party integrations (no plugins/objects, no base-tag
          // hijacking, no framing/embedding) while leaving script/style/
          // connect/img/frame sources unrestricted so Privy, Solana RPC,
          // Sentry, and remote logos keep working. Tightening script-src /
          // connect-src to an explicit allowlist is the next step, but must be
          // validated against Privy's embedded-wallet flow before enforcing.
          {
            key: 'Content-Security-Policy',
            value: "object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: `${BACKEND_ORIGIN}/:path*`,
      },
    ];
  },
  webpack: (config) => {
    // Solana web3.js requires these Node built-ins to be stubbed in the browser
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    };
    return config;
  },
};

// Source-map upload only happens when SENTRY_AUTH_TOKEN is configured;
// otherwise this wrapper just wires up runtime instrumentation.
export default withSentryConfig(nextConfig, {
  silent: true,
  disableLogger: true,
  widenClientFileUpload: false,
  telemetry: false,
});
