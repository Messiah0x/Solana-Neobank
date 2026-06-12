import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';

// Server-side proxy for the devnet USDC faucet. The faucet has no CORS
// headers, so calling it from the browser fails — routing it through our
// own origin makes it reachable from the client.
const FAUCET_URL = 'https://spl-token-faucet.com/api/token/get';

// Per-IP and per-address cooldowns. In-memory state is per serverless
// instance, so this is best-effort throttling rather than a hard guarantee —
// fine for a devnet faucet whose worst case is wasted test tokens.
const WINDOW_MS = 60_000;
const MAX_PER_IP_PER_WINDOW = 3;
const ADDRESS_COOLDOWN_MS = 30_000;

const ipHits = new Map<string, number[]>();
const addressLastHit = new Map<string, number>();

function prune(now: number) {
  if (ipHits.size > 5_000) ipHits.clear();
  if (addressLastHit.size > 5_000) addressLastHit.clear();
  for (const [ip, hits] of ipHits) {
    const recent = hits.filter((t) => now - t < WINDOW_MS);
    if (recent.length === 0) ipHits.delete(ip);
    else ipHits.set(ip, recent);
  }
}

export async function POST(req: NextRequest) {
  const now = Date.now();
  prune(now);

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown';

  const hits = (ipHits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (hits.length >= MAX_PER_IP_PER_WINDOW) {
    return NextResponse.json(
      { error: 'Too many faucet requests — try again in a minute' },
      { status: 429 },
    );
  }

  let address: string | undefined;
  try {
    const body = await req.json();
    address = typeof body?.address === 'string' ? body.address.trim() : undefined;
  } catch {
    /* fall through to validation below */
  }

  try {
    if (!address) throw new Error('missing');
    new PublicKey(address); // full base58 + curve length validation
  } catch {
    return NextResponse.json({ error: 'Invalid address' }, { status: 400 });
  }

  const lastForAddress = addressLastHit.get(address);
  if (lastForAddress && now - lastForAddress < ADDRESS_COOLDOWN_MS) {
    return NextResponse.json(
      { error: 'This address was just funded — wait a moment before retrying' },
      { status: 429 },
    );
  }

  hits.push(now);
  ipHits.set(ip, hits);
  addressLastHit.set(address, now);

  try {
    const res = await fetch(FAUCET_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, token: 'USDC' }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Faucet returned ${res.status}` },
        { status: 502 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Faucet unreachable' }, { status: 502 });
  }
}
