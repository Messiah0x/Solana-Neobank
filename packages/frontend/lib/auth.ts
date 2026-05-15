import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      checks: ['none'],
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
      const err = metadata instanceof Error ? metadata : (metadata as { error?: Error })?.error;
      const msg = err?.message ?? JSON.stringify(metadata);
      console.log(`[ERR:${code}] ${msg}`);
    },
    warn(code) {
      console.log(`[WARN:${code}]`);
    },
    debug(code, metadata) {
      console.log(`[DBG:${code}]`, JSON.stringify(metadata)?.slice(0, 200));
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
