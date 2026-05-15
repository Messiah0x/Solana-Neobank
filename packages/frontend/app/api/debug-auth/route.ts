import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const clientId = process.env.GITHUB_CLIENT_ID ?? '';
  const clientSecret = process.env.GITHUB_CLIENT_SECRET ?? '';

  let githubResponse: unknown = null;
  try {
    const resp = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code: 'test' }),
    });
    githubResponse = await resp.json();
  } catch (e) {
    githubResponse = { fetchError: e instanceof Error ? e.message : String(e) };
  }

  return NextResponse.json({
    clientIdLength: clientId.length,
    clientIdFirst4: clientId.slice(0, 4),
    clientSecretLength: clientSecret.length,
    githubResponse,
  });
}
