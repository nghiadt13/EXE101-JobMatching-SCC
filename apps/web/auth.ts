import NextAuth from 'next-auth';
import authConfig from './auth.config';

const authSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

if (!authSecret) {
  throw new Error('Missing AUTH_SECRET (or NEXTAUTH_SECRET) for NextAuth configuration');
}

const nextAuth = NextAuth({
  ...authConfig,
  secret: authSecret,
});

function isJwtSessionError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  const name = error instanceof Error ? error.name : '';
  return message.includes('JWTSessionError') || name.includes('JWTSessionError');
}

const safeAuth = ((...args: unknown[]) => {
  if (args.length === 0) {
    return nextAuth.auth().catch((error: unknown) => {
      if (isJwtSessionError(error)) {
        return null;
      }
      throw error;
    });
  }

  return nextAuth.auth(...(args as Parameters<typeof nextAuth.auth>));
}) as typeof nextAuth.auth;

const auth = safeAuth;

export const { handlers, signIn, signOut } = nextAuth;
export { auth };
