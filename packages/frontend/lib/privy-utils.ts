import type { User } from '@privy-io/react-auth';

export interface PrivyUserInfo {
  name: string;
  email: string;
  image: string | null;
  provider: string;
  initials: string;
}

export function getPrivyUserInfo(user: User | null): PrivyUserInfo {
  if (!user) {
    return { name: 'Account', email: '', image: null, provider: 'unknown', initials: 'A' };
  }

  const name =
    user.github?.name ??
    user.google?.name ??
    user.email?.address?.split('@')[0] ??
    'Account';

  const email =
    user.email?.address ??
    user.github?.email ??
    user.google?.email ??
    '';

  const image =
    (user.github as any)?.profilePictureUrl ??
    (user.google as any)?.profilePictureUrl ??
    null;

  const provider = user.github ? 'github' : user.google ? 'google' : 'email';

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'A';

  return { name, email, image, provider, initials };
}
