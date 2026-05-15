import { prisma } from './prisma';

// The frontend sends session.user.email as "userId". We upsert the User row on
// first contact so FK constraints are satisfied, then return the real db cuid.
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
  const user = await prisma.user.upsert({
    where: { id: emailOrId },
    create: { id: emailOrId },
    update: {},
    select: { id: true },
  });
  return user.id;
}
