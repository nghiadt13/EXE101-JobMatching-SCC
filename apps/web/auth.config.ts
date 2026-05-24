import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import { cookies } from 'next/headers';
import { loginWithCredentials, socialLoginClient } from '@/lib/api-client';
import type { SocialProvider, UserRole } from '@/lib/api-client';

const USER_ROLES: UserRole[] = ['ADMIN', 'RECRUITER', 'CANDIDATE'];
const SOCIAL_SIGNUP_ROLE_COOKIE = 'social_signup_role';
const SOCIAL_AUTH_ERROR_COOKIE = 'social_auth_error';
const SOCIAL_AUTH_ERROR_BACKEND = 'backend_unreachable';
const SOCIAL_AUTH_ERROR_INVALID_PROFILE = 'invalid_profile';
const SOCIAL_SIGNUP_ROLES = ['CANDIDATE', 'RECRUITER'] as const;
type SocialSignupRole = (typeof SOCIAL_SIGNUP_ROLES)[number];

async function setSocialAuthErrorCookie(
  reason:
    | typeof SOCIAL_AUTH_ERROR_BACKEND
    | typeof SOCIAL_AUTH_ERROR_INVALID_PROFILE,
): Promise<void> {
  try {
    const cookieStore = await cookies();
    // Short TTL so the toast hint never lingers across sessions; the login
    // page consumes and clears it on render.
    cookieStore.set(SOCIAL_AUTH_ERROR_COOKIE, reason, {
      maxAge: 60,
      path: '/',
      sameSite: 'lax',
    });
  } catch {
    // Cookie store is read-only in some contexts; safe to ignore.
  }
}

function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && USER_ROLES.includes(value as UserRole);
}

function isSocialSignupRole(value: unknown): value is SocialSignupRole {
  return (
    typeof value === 'string' &&
    (SOCIAL_SIGNUP_ROLES as readonly string[]).includes(value)
  );
}

async function consumeSocialSignupRole(): Promise<SocialSignupRole> {
  const cookieStore = await cookies();
  const stored = cookieStore.get(SOCIAL_SIGNUP_ROLE_COOKIE)?.value;
  const role: SocialSignupRole = isSocialSignupRole(stored)
    ? stored
    : 'CANDIDATE';

  try {
    cookieStore.set(SOCIAL_SIGNUP_ROLE_COOKIE, '', {
      maxAge: 0,
      path: '/',
    });
  } catch {
    // Cookie store is read-only in some contexts; safe to ignore.
  }

  return role;
}

function extractFacebookAvatar(picture: unknown): string | undefined {
  if (typeof picture === 'string') {
    return picture;
  }
  if (
    picture &&
    typeof picture === 'object' &&
    'data' in (picture as Record<string, unknown>)
  ) {
    const data = (picture as { data?: unknown }).data;
    if (data && typeof data === 'object' && 'url' in (data as Record<string, unknown>)) {
      const url = (data as { url?: unknown }).url;
      if (typeof url === 'string') {
        return url;
      }
    }
  }
  return undefined;
}

const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    FacebookProvider({
      clientId: process.env.AUTH_FACEBOOK_ID,
      clientSecret: process.env.AUTH_FACEBOOK_SECRET,
    }),
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
    async signIn({ user, account, profile }) {
      if (!account) {
        return true;
      }

      const provider = account.provider;
      if (provider !== 'google' && provider !== 'facebook') {
        // Credentials and other providers do not require backend sync here.
        return true;
      }

      const email =
        (typeof profile?.email === 'string' ? profile.email : undefined) ??
        (typeof user.email === 'string' ? user.email : undefined);
      const name =
        (typeof profile?.name === 'string' ? profile.name : undefined) ??
        (typeof user.name === 'string' ? user.name : undefined);

      if (!email || !name) {
        await setSocialAuthErrorCookie(SOCIAL_AUTH_ERROR_INVALID_PROFILE);
        return false;
      }

      const avatar =
        provider === 'google'
          ? typeof (profile as { picture?: unknown } | undefined)?.picture === 'string'
            ? ((profile as { picture: string }).picture)
            : typeof user.image === 'string'
              ? user.image
              : undefined
          : extractFacebookAvatar(
              (profile as { picture?: unknown } | undefined)?.picture,
            ) ?? (typeof user.image === 'string' ? user.image : undefined);

      const providerId =
        typeof account.providerAccountId === 'string'
          ? account.providerAccountId
          : '';

      if (!providerId) {
        await setSocialAuthErrorCookie(SOCIAL_AUTH_ERROR_INVALID_PROFILE);
        return false;
      }

      const role = await consumeSocialSignupRole();

      try {
        const authResponse = await socialLoginClient({
          email,
          name,
          avatar,
          provider: provider as SocialProvider,
          providerId,
          role,
        });

        const accessToken =
          authResponse.accessToken ?? authResponse.token;

        // Mutate the user object so the jwt callback persists backend-issued
        // identity onto the NextAuth session. The OAuth provider's raw access
        // token is intentionally discarded to satisfy Requirement 4.4.
        user.id = authResponse.user.id;
        user.email = authResponse.user.email;
        user.name = authResponse.user.name;
        user.role = authResponse.user.role;
        user.accessToken = accessToken;

        return true;
      } catch {
        // Tag the failure as a backend connectivity issue so the client toast
        // can render the requirement-mandated message (Req 5.3) instead of a
        // generic OAuth error.
        await setSocialAuthErrorCookie(SOCIAL_AUTH_ERROR_BACKEND);
        return false;
      }
    },
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
