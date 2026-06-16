import 'dotenv/config';
import * as Sentry from '@sentry/node';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import walletRoutes from './routes/wallet';
import yieldRoutes from './routes/yield';
import flipRoutes from './routes/flip';
import healthRoutes from './routes/health';
import marketRoutes from './routes/market';
import { authenticate, logAuthMode } from './lib/auth';

// Error monitoring — no-op unless SENTRY_DSN is configured.
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: Boolean(process.env.SENTRY_DSN),
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV ?? 'development',
});

const server = Fastify({
  logger: {
    level: process.env.LOG_LEVEL ?? 'info',
    transport:
      process.env.NODE_ENV === 'development'
        ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } }
        : undefined,
  },
});

async function build() {
  const allowedOrigins = (process.env.FRONTEND_URL ?? 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim());

  await server.register(helmet, {
    // Pure JSON API — a restrictive CSP costs nothing and hardens any
    // accidental HTML responses (error pages etc.).
    contentSecurityPolicy: { directives: { defaultSrc: ["'none'"] } },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  });

  await server.register(cors, {
    // Browser requests are restricted to known frontends. Server-to-server
    // traffic (the Next.js rewrite proxy) carries no Origin header and is
    // unaffected by CORS.
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Type'],
    preflight: true,
    strictPreflight: false,
  });

  // Basic per-IP rate limiting to keep abuse (and our RPC bill) in check.
  // Health checks are exempt.
  await server.register(rateLimit, {
    max: 120,
    timeWindow: '1 minute',
    allowList: (req) => req.url === '/api/health',
  });

  // Privy access-token verification. Routes marked `config: { public: true }`
  // (health, APY) are exempt; everything else requires a verified identity
  // when PRIVY_APP_ID/PRIVY_APP_SECRET are configured.
  logAuthMode(server.log);
  server.addHook('preHandler', authenticate);

  await server.register(walletRoutes, { prefix: '/api/wallet' });
  await server.register(yieldRoutes, { prefix: '/api/yield' });
  await server.register(flipRoutes, { prefix: '/api/flip' });
  await server.register(marketRoutes, { prefix: '/api/market' });
  await server.register(healthRoutes, { prefix: '/api' });

  server.setErrorHandler((err, _req, reply) => {
    server.log.error(err);
    Sentry.captureException(err);
    reply.code(500).send({ success: false, error: 'Internal server error' });
  });

  return server;
}

process.on('unhandledRejection', (reason) => {
  server.log.error({ reason }, 'unhandledRejection');
});

process.on('uncaughtException', (err) => {
  server.log.error(err, 'uncaughtException');
});

async function start() {
  try {
    const app = await build();
    const port = Number(process.env.PORT ?? 4000);
    // '::' binds dual-stack (IPv6 + IPv4). Railway's public edge proxy reaches
    // containers over IPv6 — binding only 0.0.0.0 makes public traffic 502
    // even while IPv4 healthchecks pass. HOST overrides for IPv4-only envs.
    await app.listen({ port, host: process.env.HOST ?? '::' });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

start();
