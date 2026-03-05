import NextAuth from 'next-auth';
import authConfig from './auth.config';

const authSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

if (!authSecret) {
  throw new Error('Missing AUTH_SECRET (or NEXTAUTH_SECRET) for NextAuth configuration');
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  secret: authSecret,
});
