'use client';

import { useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

const SOCIAL_AUTH_ERROR_COOKIE = 'social_auth_error';

const BACKEND_UNREACHABLE_MESSAGE =
  'Unable to connect to authentication server. Please try again later.';
const CANCELLED_MESSAGE = 'Authentication process cancelled';
const GENERIC_FAILURE_MESSAGE = 'Authentication failed. Please try again.';

type ToastKind = 'cancelled' | 'backend' | 'generic';

type ResolvedToast = {
  message: string;
  icon: string;
  kind: ToastKind;
};

function readCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const target = `${name}=`;
  const segments = document.cookie ? document.cookie.split(';') : [];
  for (const raw of segments) {
    const segment = raw.trim();
    if (segment.startsWith(target)) {
      return decodeURIComponent(segment.slice(target.length));
    }
  }
  return undefined;
}

function clearCookie(name: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; path=/; max-age=0`;
}

/**
 * Map a NextAuth `?error=` query value plus an optional backend hint cookie
 * into a user-facing toast description.
 *
 * NextAuth emits provider-specific error codes such as `OAuthCallback`,
 * `OAuthSignin`, `AccessDenied`, `Configuration`, and `Verification`. The
 * `signIn` callback in `auth.config.ts` also drops a `social_auth_error`
 * cookie when the backend sync fails, letting us distinguish a backend
 * outage (Req 5.3) from a user-cancelled OAuth dialog (Req 5.1).
 */
export function resolveSocialAuthError(
  errorParam: string | null,
  backendHint: string | undefined,
): ResolvedToast | null {
  if (backendHint === 'backend_unreachable') {
    return {
      message: BACKEND_UNREACHABLE_MESSAGE,
      icon: '⚠️',
      kind: 'backend',
    };
  }

  if (!errorParam) {
    return null;
  }

  // NextAuth surfaces user-cancelled OAuth dialogs as `AccessDenied`.
  if (errorParam === 'AccessDenied') {
    return { message: CANCELLED_MESSAGE, icon: 'ℹ️', kind: 'cancelled' };
  }

  // The `signIn` callback returning `false` from a backend failure surfaces
  // as `OAuthCallback` / `Callback` / `OAuthSignin`. If we did not also see
  // the backend hint cookie above, fall back to a generic failure message.
  return { message: GENERIC_FAILURE_MESSAGE, icon: '⚠️', kind: 'generic' };
}

type ShowToast = (message: string, icon?: string) => void;

/**
 * Client hook that watches the URL for NextAuth's `?error=` query param and
 * dispatches an `AuthToast` describing the failure. It also consumes the
 * `social_auth_error` cookie (set by the NextAuth `signIn` callback when the
 * backend sync fails) so the user sees the requirement-specified copy.
 *
 * After dispatching the toast it strips `error` from the URL so refreshing
 * the page does not retrigger the same toast.
 */
export function useSocialAuthErrorToast(showToast: ShowToast): void {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const errorParam = searchParams?.get('error') ?? null;

  useEffect(() => {
    const backendHint = readCookie(SOCIAL_AUTH_ERROR_COOKIE);
    const resolved = resolveSocialAuthError(errorParam, backendHint);

    if (!resolved) return;

    showToast(resolved.message, resolved.icon);

    // Always clear the hint cookie once it has been consumed so subsequent
    // sign-in attempts start from a clean slate.
    if (backendHint) {
      clearCookie(SOCIAL_AUTH_ERROR_COOKIE);
    }

    // Strip the `error` query param so a page refresh does not replay the
    // toast. Preserve any other params the page may rely on (e.g.
    // `callbackUrl`).
    if (errorParam && pathname) {
      const next = new URLSearchParams(searchParams?.toString() ?? '');
      next.delete('error');
      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname);
    }
    // We intentionally only depend on `errorParam` so the effect runs once
    // per error surface; pathname/router/searchParams are stable refs from
    // Next.js navigation hooks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errorParam]);
}
