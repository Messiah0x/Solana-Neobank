import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';

const useSecure = process.env.NODE_ENV === 'production';
const cookiePrefix = useSecure ? '__Secure-' : '';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt',
  },
  debug: process.env.NODE_ENV === 'production',
  logger: {
    error(code, metadata) {
      console.error('[NEXTAUTH_FULL_ERROR]', code, JSON.stringify(metadata, null, 2));
    },
    warn(code) {
      console.warn('[NEXTAUTH_WARN]', code);
    },
    debug(code, metadata) {
      console.log('[NEXTAUTH_DEBUG]', code, JSON.stringify(metadata, null, 2));
    },
  },
  cookies: {
    sessionToken: {
      name: `${cookiePrefix}next-auth.session-token`,
      options: { httpOnly: true, sameSite: 'lax', path: '/', secure: useSecure },
    },
    callbackUrl: {
      name: `${cookiePrefix}next-auth.callback-url`,
      options: { sameSite: 'lax', path: '/', secure: useSecure },
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: { httpOnly: true, sameSite: 'lax', path: '/', secure: useSecure },
    },
    state: {
      name: `${cookiePrefix}next-auth.state`,
      options: { httpOnly: true, sameSite: 'lax', path: '/', secure: useSecure, maxAge: 900 },
    },
    nonce: {
      name: `${cookiePrefix}next-auth.nonce`,
      options: { httpOnly: true, sameSite: 'lax', path: '/', secure: useSecure },
    },
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.userId = user.id;
        token.provider = account?.provider;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.provider = token.provider as string;
      }
      return session;
    },
  },
};
