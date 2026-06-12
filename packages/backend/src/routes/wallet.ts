import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import * as walletService from '../services/wallet.service';
import { requestUserId } from '../lib/auth';

// userId is optional in request bodies: in strict auth mode the identity
// comes from the verified Privy token and any client-supplied value is
// ignored. It is only honored as a fallback when auth is not configured.
const createWalletBody = z.object({
  userId: z.string().min(1).max(256).optional(),
});

const registerWalletBody = z.object({
  userId: z.string().min(1).max(256).optional(),
  publicKey: z.string().min(32).max(64),
});

function handleError(err: unknown, reply: FastifyReply) {
  const error = err as Error & { code?: string };
  if (error.code === 'UNAUTHORIZED') return reply.code(401).send({ success: false, error: 'Unauthorized' });
  if (error.code === 'NOT_FOUND') return reply.code(404).send({ success: false, error: error.message });
  if (error.code === 'WALLET_EXISTS') return reply.code(409).send({ success: false, error: error.message });
  reply.log.error(err);
  return reply.code(500).send({ success: false, error: 'Internal server error' });
}

export default async function walletRoutes(fastify: FastifyInstance) {
  // POST /api/wallet/register — stores a Privy-managed wallet (public key only)
  fastify.post('/register', { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = registerWalletBody.parse(req.body);
      const userId = requestUserId(req, body.userId);
      const wallet = await walletService.registerExternalWallet(userId, body.publicKey);
      return reply.code(201).send({ success: true, data: wallet });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return reply.code(400).send({ success: false, error: err.errors });
      }
      return handleError(err, reply);
    }
  });

  // POST /api/wallet/create
  fastify.post('/create', { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = createWalletBody.parse(req.body);
      const userId = requestUserId(req, body.userId);
      const wallet = await walletService.createWallet(userId);
      return reply.code(201).send({ success: true, data: wallet });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return reply.code(400).send({ success: false, error: err.errors });
      }
      return handleError(err, reply);
    }
  });

  // GET /api/wallet/:userId
  fastify.get('/:userId', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const params = req.params as { userId: string };
      const userId = requestUserId(req, params.userId);
      const wallet = await walletService.getWallet(userId);
      return reply.send({ success: true, data: wallet });
    } catch (err) {
      return handleError(err, reply);
    }
  });

  // GET /api/wallet/:userId/balance
  fastify.get('/:userId/balance', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const params = req.params as { userId: string };
      const userId = requestUserId(req, params.userId);
      const balance = await walletService.getWalletBalance(userId);
      return reply.send({ success: true, data: balance });
    } catch (err) {
      return handleError(err, reply);
    }
  });

  // GET /api/wallet/:userId/transactions
  fastify.get('/:userId/transactions', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const params = req.params as { userId: string };
      const userId = requestUserId(req, params.userId);
      const query = req.query as { limit?: string };
      const limit = Math.min(Number(query.limit ?? 10), 50);
      const txs = await walletService.getWalletTransactions(userId, limit);
      return reply.send({ success: true, data: txs });
    } catch (err) {
      return handleError(err, reply);
    }
  });
}
