import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import * as flipService from '../services/flip.service';
import { requestUserId } from '../lib/auth';

const currency = z.enum(['SOL', 'USDC']);
const amount = z.number().positive().finite().max(1_000_000);

const prepareBody = z.object({
  userId: z.string().min(1).max(128).optional(),
  currency,
  amount,
});

const resolveBody = z.object({
  userId: z.string().min(1).max(128).optional(),
  currency,
  amount,
  betSignature: z.string().min(32).max(128),
});

function handleError(err: unknown, reply: FastifyReply) {
  const error = err as Error & { code?: string };
  if (error.code === 'UNAUTHORIZED') return reply.code(401).send({ success: false, error: 'Unauthorized' });
  if (error.code === 'NOT_FOUND') return reply.code(404).send({ success: false, error: error.message });
  if (error.code === 'BAD_BET') return reply.code(400).send({ success: false, error: error.message });
  if (error.code === 'FLIP_DISABLED') return reply.code(503).send({ success: false, error: error.message });
  if (error.code === 'PAYOUT_FAILED') return reply.code(502).send({ success: false, error: error.message, code: 'PAYOUT_FAILED' });
  reply.log.error(err);
  return reply.code(500).send({ success: false, error: 'Internal server error' });
}

const flipRateLimit = { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } };

export default async function flipRoutes(fastify: FastifyInstance) {
  // GET /api/flip/house — whether the game is live and current max bets
  fastify.get('/house', async (_req, reply) => {
    try {
      const status = await flipService.getHouseStatus();
      return reply.send({ success: true, data: status });
    } catch (err) {
      return handleError(err, reply);
    }
  });

  // POST /api/flip/prepare — build the unsigned bet transfer for client signing
  fastify.post('/prepare', flipRateLimit, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = prepareBody.parse(req.body);
      const userId = requestUserId(req, body.userId);
      const result = await flipService.prepareBet(userId, body.currency, body.amount);
      return reply.send({ success: true, data: result });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return reply.code(400).send({ success: false, error: err.errors });
      }
      return handleError(err, reply);
    }
  });

  // POST /api/flip/resolve — verify the bet landed, flip, pay out on a win
  fastify.post('/resolve', flipRateLimit, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = resolveBody.parse(req.body);
      const userId = requestUserId(req, body.userId);
      const result = await flipService.resolveBet(userId, body.currency, body.amount, body.betSignature);
      return reply.send({ success: true, data: result });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return reply.code(400).send({ success: false, error: err.errors });
      }
      return handleError(err, reply);
    }
  });

  // GET /api/flip/history/:userId
  fastify.get('/history/:userId', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const params = req.params as { userId: string };
      const userId = requestUserId(req, params.userId);
      const history = await flipService.getFlipHistory(userId);
      return reply.send({ success: true, data: history });
    } catch (err) {
      return handleError(err, reply);
    }
  });
}
