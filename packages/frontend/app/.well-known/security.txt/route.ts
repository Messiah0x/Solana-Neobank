const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://solana-neobank-beta.vercel.app';

// RFC 9116 — tells security researchers how to report vulnerabilities.
export async function GET() {
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);

  const body = [
    `Contact: mailto:security@avanor.app`,
    `Expires: ${expires.toISOString()}`,
    `Preferred-Languages: en`,
    `Canonical: ${SITE_URL}/.well-known/security.txt`,
  ].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
