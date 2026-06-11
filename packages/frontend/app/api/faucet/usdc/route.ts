import { NextRequest, NextResponse } from 'next/server';

// Server-side proxy for the devnet USDC faucet. The faucet has no CORS
// headers, so calling it from the browser fails — routing it through our
// own origin makes it reachable from the client.
const FAUCET_URL = 'https://spl-token-faucet.com/api/token/get';

export async function POST(req: NextRequest) {
  let address: string | undefined;
  try {
    const body = await req.json();
    address = typeof body?.address === 'string' ? body.address : undefined;
  } catch {
    /* fall through to validation below */
  }
  if (!address || address.length < 32 || address.length > 44) {
    return NextResponse.json({ error: 'Invalid address' }, { status: 400 });
  }

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
