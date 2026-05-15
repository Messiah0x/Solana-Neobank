import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import * as walletService from '../services/wallet.service';

const createWalletBody = z.object({
  userId: z.string().min(1).max(128),
});

function handleError(err: unknown, reply: FastifyReply) {
  const error = err as Error & { code?: string };
  if (error.code === 'NOT_FOUND') return reply.code(404).send({ success: false, error: error.message });
  if (error.code === 'WALLET_EXISTS') return reply.code(409).send({ success: false, error: error.message });
  reply.log.error(err);
  return reply.code(500).send({ success: false, error: 'Internal server error' });
}

export default async function walletRoutes(fastify: FastifyInstance) {
  // POST /api/wallet/create
  fastify.post('/create', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = createWalletBody.parse(req.body);
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
      const { userId } = req.params as { userId: string };
      const wallet = await walletService.getWallet(userId);
      return reply.send({ success: true, data: wallet });
    } catch (err) {
      return handleError(err, reply);
    }
  });

  // GET /api/wallet/:userId/balance
  fastify.get('/:userId/balance', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = req.params as { userId: string };
      const balance = await walletService.getWalletBalance(userId);
      return reply.send({ success: true, data: balance });
    } catch (err) {
      return handleError(err, reply);
    }
  });

  // GET /api/wallet/:userId/transactions
  fastify.get('/:userId/transactions', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = req.params as { userId: string };
      const query = req.query as { limit?: string };
      const limit = Math.min(Number(query.limit ?? 10), 50);
      const txs = await walletService.getWalletTransactions(userId, limit);
      return reply.send({ success: true, data: txs });
    } catch (err) {
      return handleError(err, reply);
    }
  });
}
