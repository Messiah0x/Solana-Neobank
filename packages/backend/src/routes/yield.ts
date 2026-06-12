import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import * as yieldService from '../services/yield.service';
import { requestUserId } from '../lib/auth';

// userId is optional in request bodies: in strict auth mode the identity
// comes from the verified Privy token and any client-supplied value is
// ignored. It is only honored as a fallback when auth is not configured.
const depositBody = z.object({
  userId: z.string().min(1).max(128).optional(),
  amountUsdc: z.number().positive(),
});

const withdrawBody = z.object({
  userId: z.string().min(1).max(128).optional(),
  amountUsdc: z.number().positive(),
});

const confirmBody = z.object({
  userId: z.string().min(1).max(128).optional(),
  amountUsdc: z.number().positive(),
  signature: z.string().min(32).max(128),
  marginfiAccountPk: z.string().min(32).max(64),
});

function handleError(err: unknown, reply: FastifyReply) {
  const error = err as Error & { code?: string };
  if (error.code === 'UNAUTHORIZED') return reply.code(401).send({ success: false, error: 'Unauthorized' });
  if (error.code === 'NOT_FOUND') return reply.code(404).send({ success: false, error: error.message });
  if (error.code === 'CLIENT_SIGN_REQUIRED') return reply.code(422).send({ success: false, error: error.message, code: 'CLIENT_SIGN_REQUIRED' });
  reply.log.error(err);
  return reply.code(500).send({ success: false, error: 'Internal server error' });
}

export default async function yieldRoutes(fastify: FastifyInstance) {
  // GET /api/yield/apy — public market data, no auth needed
  fastify.get('/apy', { config: { public: true } }, async (_req, reply) => {
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
      const params = req.params as { userId: string };
      const userId = requestUserId(req, params.userId);
      const data = await yieldService.getYieldData(userId);
      return reply.send({ success: true, data });
    } catch (err) {
      return handleError(err, reply);
    }
  });

  // POST /api/yield/deposit/prepare — build an unsigned tx for client-side signing
  fastify.post('/deposit/prepare', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = depositBody.parse(req.body);
      const userId = requestUserId(req, body.userId);
      const result = await yieldService.prepareDeposit(userId, body.amountUsdc);
      return reply.send({ success: true, data: result });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return reply.code(400).send({ success: false, error: err.errors });
      }
      return handleError(err, reply);
    }
  });

  // POST /api/yield/deposit/confirm — verify the signed tx landed, record position
  fastify.post('/deposit/confirm', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = confirmBody.parse(req.body);
      const userId = requestUserId(req, body.userId);
      const result = await yieldService.confirmDeposit(userId, body.amountUsdc, body.signature, body.marginfiAccountPk);
      return reply.code(201).send({ success: true, data: result });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return reply.code(400).send({ success: false, error: err.errors });
      }
      return handleError(err, reply);
    }
  });

  // POST /api/yield/withdraw/prepare
  fastify.post('/withdraw/prepare', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = withdrawBody.parse(req.body);
      const userId = requestUserId(req, body.userId);
      const result = await yieldService.prepareWithdraw(userId, body.amountUsdc);
      return reply.send({ success: true, data: result });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return reply.code(400).send({ success: false, error: err.errors });
      }
      return handleError(err, reply);
    }
  });

  // POST /api/yield/withdraw/confirm
  fastify.post('/withdraw/confirm', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = confirmBody.omit({ marginfiAccountPk: true }).parse(req.body);
      const userId = requestUserId(req, body.userId);
      const result = await yieldService.confirmWithdraw(userId, body.amountUsdc, body.signature);
      return reply.send({ success: true, data: result });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return reply.code(400).send({ success: false, error: err.errors });
      }
      return handleError(err, reply);
    }
  });

  // POST /api/yield/deposit
  fastify.post('/deposit', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = depositBody.parse(req.body);
      const userId = requestUserId(req, body.userId);
      const result = await yieldService.deposit(userId, body.amountUsdc);
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
      const body = withdrawBody.parse(req.body);
      const userId = requestUserId(req, body.userId);
      const result = await yieldService.withdraw(userId, body.amountUsdc);
      return reply.send({ success: true, data: result });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return reply.code(400).send({ success: false, error: err.errors });
      }
      return handleError(err, reply);
    }
  });
}
