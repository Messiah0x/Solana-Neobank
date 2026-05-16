import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';

export default async function healthRoutes(fastify: FastifyInstance) {
  fastify.get('/health', async (_req, reply) => {
    let db = 'ok';
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (err) {
      db = err instanceof Error ? err.message : 'error';
    }
    const status = db === 'ok' ? 'ok' : 'degraded';
    return reply.code(db === 'ok' ? 200 : 503).send({
      status,
      db,
      timestamp: new Date().toISOString(),
    });
  });
}

