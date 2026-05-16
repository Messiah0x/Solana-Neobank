import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import walletRoutes from './routes/wallet';
import yieldRoutes from './routes/yield';
import healthRoutes from './routes/health';

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

  await server.register(cors, {
    origin: true, // reflect request origin — allows all origins while keeping credentials
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Type'],
    preflight: true,
    strictPreflight: false,
  });

  await server.register(walletRoutes, { prefix: '/api/wallet' });
  await server.register(yieldRoutes, { prefix: '/api/yield' });
  await server.register(healthRoutes, { prefix: '/api' });

  server.setErrorHandler((err, _req, reply) => {
    server.log.error(err);
    reply.code(500).send({ success: false, error: 'Internal server error' });
  });

  return server;
}

async function start() {
  try {
    const app = await build();
    const port = Number(process.env.PORT ?? 4000);
    await app.listen({ port, host: '0.0.0.0' });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

start();
