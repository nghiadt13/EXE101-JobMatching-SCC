import { describe, it, expect } from 'vitest';
import { resolveSocialAuthError } from '../use-social-auth-error';

/**
 * Unit tests for the `resolveSocialAuthError` mapper that powers the
 * `AuthToast` shown on the Login page when NextAuth redirects back with an
 * `?error=` query param after a failed social sign-in.
 *
 * The mapper covers Requirements 2.8, 5.1, and 5.3.
 */
describe('resolveSocialAuthError', () => {
  describe('backend connectivity hint takes precedence (Requirement 5.3 / 2.8)', () => {
    it('returns the backend-specific message when the cookie hint is set', () => {
      const result = resolveSocialAuthError('OAuthCallback', 'backend_unreachable');

      expect(result).toEqual({
        message: 'Unable to connect to authentication server. Please try again later.',
        icon: '⚠️',
        kind: 'backend',
      });
    });

    it('returns the backend-specific message even when the error param is absent', () => {
      const result = resolveSocialAuthError(null, 'backend_unreachable');

      expect(result).toEqual({
        message: 'Unable to connect to authentication server. Please try again later.',
        icon: '⚠️',
        kind: 'backend',
      });
    });
  });

  describe('OAuth cancellation (Requirement 5.1)', () => {
    it('returns the cancelled message when NextAuth reports AccessDenied', () => {
      const result = resolveSocialAuthError('AccessDenied', undefined);

      expect(result).toEqual({
        message: 'Authentication process cancelled',
        icon: 'ℹ️',
        kind: 'cancelled',
      });
    });
  });

  describe('generic OAuth failures', () => {
    it('returns a generic failure message for unknown error codes', () => {
      const result = resolveSocialAuthError('OAuthSignin', undefined);

      expect(result).toEqual({
        message: 'Authentication failed. Please try again.',
        icon: '⚠️',
        kind: 'generic',
      });
    });

    it('returns a generic failure message for OAuthCallback without backend hint', () => {
      const result = resolveSocialAuthError('OAuthCallback', undefined);

      expect(result).toEqual({
        message: 'Authentication failed. Please try again.',
        icon: '⚠️',
        kind: 'generic',
      });
    });
  });

  describe('no error to surface', () => {
    it('returns null when neither error param nor backend hint is present', () => {
      const result = resolveSocialAuthError(null, undefined);

      expect(result).toBeNull();
    });

    it('returns null when error param is empty string and no backend hint', () => {
      const result = resolveSocialAuthError('', undefined);

      expect(result).toBeNull();
    });
  });
});
