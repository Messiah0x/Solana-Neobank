import { FastifyInstance } from 'fastify';
import { connection } from '../lib/helius';
import { prisma } from '../lib/prisma';

export default async function healthRoutes(fastify: FastifyInstance) {
  fastify.get('/health', async (_req, reply) => {
    const start = Date.now();

    const [slot, dbOk] = await Promise.all([
      connection.getSlot().catch(() => null),
      prisma.$queryRaw`SELECT 1`
        .then(() => true)
        .catch(() => false),
    ]);

    return reply.send({
      status: 'ok',
      latencyMs: Date.now() - start,
      timestamp: new Date().toISOString(),
      services: {
        solana: {
          status: slot !== null ? 'connected' : 'disconnected',
          currentSlot: slot,
        },
        database: {
          status: dbOk ? 'connected' : 'disconnected',
        },
      },
    });
  });
}
