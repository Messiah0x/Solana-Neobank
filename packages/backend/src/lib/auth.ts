import { PrivyClient } from '@privy-io/server-auth';
import type { FastifyReply, FastifyRequest } from 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    /** Privy DID (did:privy:...) extracted from a verified access token. */
    authUserId?: string;
  }
}

const PRIVY_APP_ID = process.env.PRIVY_APP_ID;
const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET;

/**
 * Strict mode is on whenever Privy server credentials are configured.
 * In strict mode every non-public route requires a valid Bearer token and
 * the user identity comes exclusively from the verified token claims —
 * client-supplied userIds in bodies/params are ignored.
 *
 * Without credentials (local dev, or a deploy that hasn't set them yet) we
 * fall back to trusting the client-supplied userId, with a loud warning at
 * startup so this never silently ships to production.
 */
export const authStrict = Boolean(PRIVY_APP_ID && PRIVY_APP_SECRET);

const privy = authStrict ? new PrivyClient(PRIVY_APP_ID!, PRIVY_APP_SECRET!) : null;

export function logAuthMode(log: { warn: (msg: string) => void; info: (msg: string) => void }) {
  if (authStrict) {
    log.info('Auth: Privy token verification ENABLED (strict mode)');
  } else {
    log.warn(
      'Auth: PRIVY_APP_ID / PRIVY_APP_SECRET not set — API trusts client-supplied userIds. ' +
        'Set both env vars to enforce token verification before going to production.',
    );
  }
}

/**
 * Global preHandler. Routes opt out by declaring `config: { public: true }`.
 */
export async function authenticate(req: FastifyRequest, reply: FastifyReply) {
  const routeConfig = req.routeOptions?.config as { public?: boolean } | undefined;
  if (routeConfig?.public) return;

  if (!privy) return; // dev fallback — handlers use client-supplied userId

  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
  if (!token) {
    return reply.code(401).send({ error: 'Missing Authorization bearer token' });
  }

  try {
    const claims = await privy.verifyAuthToken(token);
    req.authUserId = claims.userId; // did:privy:...
  } catch {
    return reply.code(401).send({ error: 'Invalid or expired access token' });
  }
}

/**
 * Resolves the user identity for a request: the verified token identity in
 * strict mode, otherwise the client-supplied value. Throws a typed error the
 * route handlers map to 401 when neither is present.
 */
export function requestUserId(req: FastifyRequest, clientProvided?: string): string {
  if (req.authUserId) return req.authUserId;
  if (!authStrict && clientProvided) return clientProvided;
  const err = new Error('Unauthorized') as Error & { code: string };
  err.code = 'UNAUTHORIZED';
  throw err;
}
