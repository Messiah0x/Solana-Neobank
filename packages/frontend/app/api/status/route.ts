import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const BACKEND_ORIGIN = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

// Public, unauthenticated uptime probe. It deliberately exposes only whether
// the backend is reachable and healthy — never the internal backend origin,
// the raw health body, or upstream error strings, which would only aid recon.
export async function GET() {
  const startedAt = Date.now();
  try {
    const res = await fetch(`${BACKEND_ORIGIN}/api/health`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });
    const healthy = res.ok;
    return NextResponse.json(
      {
        frontend: 'ok',
        backend: healthy ? 'ok' : 'degraded',
        latencyMs: Date.now() - startedAt,
      },
      { status: healthy ? 200 : 503 },
    );
  } catch {
    return NextResponse.json(
      { frontend: 'ok', backend: 'unreachable', latencyMs: Date.now() - startedAt },
      { status: 502 },
    );
  }
}
