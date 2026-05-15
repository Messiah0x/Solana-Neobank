import { prisma } from './prisma';

// Resolves any user identifier (email, cuid, or Privy DID like "did:privy:xxx")
// to a stable DB row, creating one on first contact.
export async function resolveDbUserId(emailOrId: string): Promise<string> {
  if (emailOrId.includes('@')) {
    const user = await prisma.user.upsert({
      where: { email: emailOrId },
      create: { email: emailOrId },
      update: {},
      select: { id: true },
    });
    return user.id;
  }
  // Privy DID or plain cuid — use as stable external ID
  const user = await prisma.user.upsert({
    where: { id: emailOrId },
    create: { id: emailOrId },
    update: {},
    select: { id: true },
  });
  return user.id;
}
