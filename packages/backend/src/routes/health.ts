import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';

export default async function healthRoutes(fastify: FastifyInstance) {
  fastify.get('/health', { config: { public: true } }, async (_req, reply) => {
    let db = 'ok';
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (err) {
      // Keep the detail in logs; never return raw DB errors (which can carry
      // connection strings / host names) to an unauthenticated caller.
      db = 'error';
      fastify.log.error({ err }, '[health] db check failed');
    }
    const status = db === 'ok' ? 'ok' : 'degraded';
    return reply.code(db === 'ok' ? 200 : 503).send({
      status,
      db,
      timestamp: new Date().toISOString(),
    });
  });
}

