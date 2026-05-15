import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import * as yieldService from '../services/yield.service';

const depositBody = z.object({
  userId: z.string().min(1).max(128),
  amountUsdc: z.number().positive(),
});

const withdrawBody = z.object({
  userId: z.string().min(1).max(128),
  amountUsdc: z.number().positive(),
});

function handleError(err: unknown, reply: FastifyReply) {
  const error = err as Error & { code?: string };
  if (error.code === 'NOT_FOUND') return reply.code(404).send({ success: false, error: error.message });
  reply.log.error(err);
  return reply.code(500).send({ success: false, error: 'Internal server error' });
}

export default async function yieldRoutes(fastify: FastifyInstance) {
  // GET /api/yield/apy — public, no auth needed
  fastify.get('/apy', async (_req, reply) => {
    try {
      const apy = await yieldService.getCurrentApy();
      return reply.send({ success: true, data: { apy } });
    } catch (err) {
      return handleError(err, reply);
    }
  });

  // GET /api/yield/:userId
  fastify.get('/:userId', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = req.params as { userId: string };
      const data = await yieldService.getYieldData(userId);
      return reply.send({ success: true, data });
    } catch (err) {
      return handleError(err, reply);
    }
  });

  // POST /api/yield/deposit
  fastify.post('/deposit', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId, amountUsdc } = depositBody.parse(req.body);
      const result = await yieldService.deposit(userId, amountUsdc);
      return reply.code(201).send({ success: true, data: result });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return reply.code(400).send({ success: false, error: err.errors });
      }
      return handleError(err, reply);
    }
  });

  // POST /api/yield/withdraw
  fastify.post('/withdraw', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId, amountUsdc } = withdrawBody.parse(req.body);
      const result = await yieldService.withdraw(userId, amountUsdc);
      return reply.send({ success: true, data: result });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return reply.code(400).send({ success: false, error: err.errors });
      }
      return handleError(err, reply);
    }
  });
}
