import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const BACKEND_ORIGIN = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

// Server-side probe of the backend, used for diagnostics and uptime checks.
// Returns what the Vercel server sees when calling the backend directly,
// independent of the client's network.
export async function GET() {
  const startedAt = Date.now();
  try {
    const res = await fetch(`${BACKEND_ORIGIN}/api/health`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });
    const body = await res.text();
    return NextResponse.json({
      frontend: 'ok',
      backendOrigin: BACKEND_ORIGIN,
      backendStatus: res.status,
      backendBody: body.slice(0, 500),
      latencyMs: Date.now() - startedAt,
    });
  } catch (err) {
    return NextResponse.json(
      {
        frontend: 'ok',
        backendOrigin: BACKEND_ORIGIN,
        backendStatus: 'unreachable',
        error: err instanceof Error ? err.message : String(err),
        latencyMs: Date.now() - startedAt,
      },
      { status: 502 },
    );
  }
}
