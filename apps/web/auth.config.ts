import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { loginWithCredentials } from '@/lib/api-client';
import type { UserRole } from '@/lib/api-client';

const USER_ROLES: UserRole[] = ['ADMIN', 'RECRUITER', 'CANDIDATE'];

function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && USER_ROLES.includes(value as UserRole);
}

const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email =
          typeof credentials?.email === 'string' ? credentials.email.trim() : '';
        const password = typeof credentials?.password === 'string' ? credentials.password : '';

        if (!email || !password) {
          return null;
        }

        try {
          const authResponse = await loginWithCredentials(email, password);
          const accessToken = authResponse.accessToken ?? authResponse.token;

          return {
            id: authResponse.user.id,
            email: authResponse.user.email,
            name: authResponse.user.name,
            role: authResponse.user.role,
            accessToken,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = typeof user.id === 'string' ? user.id : undefined;
        token.role = isUserRole(user.role) ? user.role : undefined;
        token.accessToken =
          typeof user.accessToken === 'string' ? user.accessToken : undefined;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = typeof token.userId === 'string' ? token.userId : '';
        session.user.role = isUserRole(token.role) ? token.role : undefined;
      }
      session.accessToken =
        typeof token.accessToken === 'string' ? token.accessToken : '';

      return session;
    },
  },
};

export default authConfig;
