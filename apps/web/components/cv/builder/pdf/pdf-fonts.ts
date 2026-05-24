/**
 * pdf-fonts.ts — `@react-pdf/renderer` font registration for CV Builder 2.0.
 *
 * Why this module exists:
 *   - Centralises Vietnamese-capable TTF font registration so the work happens
 *     once per browser session.
 *   - Lives next to `resume-pdf.tsx` so it stays inside the lazy-loaded PDF
 *     chunk (see `cv-pdf-download.tsx`). Importing this module from anywhere
 *     outside that chunk would defeat code-splitting.
 *   - Exposes a single entry point (`registerCvFonts`) that is idempotent —
 *     safe to call multiple times — and is also auto-invoked at module load
 *     so any importer triggers registration.
 *
 * Vietnamese coverage:
 *   The Google Fonts CDN TTF URLs below ship the latin-ext + Vietnamese
 *   subsets, so glyphs like "ấ", "ợ", "ừ" render correctly without manual
 *   subset stitching.
 *
 * Hyphenation:
 *   Vietnamese words must NOT be split mid-syllable. We disable hyphenation
 *   via `Font.registerHyphenationCallback(word => [word])` so each word is
 *   treated as an atomic unit during line breaking.
 *
 * Fallback strategy:
 *   1. Primary: Google Fonts CDN (`https://fonts.gstatic.com/...`).
 *   2. Optional self-hosted fallback in `apps/web/public/fonts/` — drop TTFs
 *      named `Inter-Regular.ttf`, `Inter-Bold.ttf`, `Outfit-Regular.ttf`,
 *      `Outfit-Bold.ttf`, `Roboto-Regular.ttf`, `Roboto-Bold.ttf` and call
 *      `registerLocalFallbackFonts()` to swap them in. Roboto already has
 *      local files in this project (`/fonts/Roboto-Regular.ttf` and
 *      `/fonts/Roboto-Bold.ttf`); Inter/Outfit are placeholders for a
 *      follow-up commit (binary fonts intentionally not added in this task).
 *   3. Ultimate fallback: `Times-Roman` is part of the PDF base 14 fonts and
 *      is always available without registration. Templates may reference it
 *      directly when nothing else loads.
 *
 * Why error handling is best-effort:
 *   `Font.register` is synchronous and only buffers metadata — the actual
 *   network fetch of each TTF happens lazily inside `@react-pdf/renderer`
 *   during render. There is no public callback for fetch failure. The
 *   `useFontLoadStatus` hook below performs a best-effort `HEAD` probe of
 *   the CDN URLs so the UI can warn the user before they click "Tải PDF",
 *   but the probe is informational only — the render path can still fail
 *   (or succeed) independently. When the probe fails we proactively
 *   register the local fallback so the next render attempt has a chance.
 *   All caught errors are logged via `console.error` with a descriptive
 *   prefix so they show up in DevTools without crashing the editor.
 */

'use client';

import { Font } from '@react-pdf/renderer';
import { useEffect, useState } from 'react';

/**
 * User-facing message surfaced when CDN font loading is detected as
 * unavailable. Kept as a constant so the same wording is reusable across
 * `cv-pdf-download.tsx` and any toast/banner.
 */
export const FONT_FALLBACK_USER_MESSAGE =
  'Không thể tải font. Đang dùng font dự phòng...';

/** PDF base-14 fallback always available without registration. */
export const ULTIMATE_FALLBACK_FONT = 'Times-Roman';

/**
 * Primary CDN sources. Each TTF URL is the canonical Google Fonts CDN file
 * that includes the Vietnamese subset (`latin`, `latin-ext`, `vietnamese`).
 *
 * NOTE: The two Outfit URLs are identical because Outfit ships as a single
 * variable font on the CDN — react-pdf still treats it as the bold weight
 * when `fontWeight: 'bold'` is requested.
 */
const CDN_FONT_SOURCES = {
  Inter: {
    regular:
      'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.ttf',
    bold:
      'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMa2JL7SUc.ttf',
  },
  Roboto: {
    regular:
      'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.ttf',
    bold:
      'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlfBBc4.ttf',
  },
  Outfit: {
    regular:
      'https://fonts.gstatic.com/s/outfit/v11/QGYvz_MVcBeNP4NJuktqkA.ttf',
    bold:
      'https://fonts.gstatic.com/s/outfit/v11/QGYvz_MVcBeNP4NJuktqkA.ttf',
  },
} as const;

/**
 * Local fallback paths under `apps/web/public/fonts/`. Files only need to
 * exist when `registerLocalFallbackFonts()` is called. Roboto files exist
 * today; Inter/Outfit will be added in a follow-up.
 */
const LOCAL_FONT_PATHS = {
  Inter: {
    regular: '/fonts/Inter-Regular.ttf',
    bold: '/fonts/Inter-Bold.ttf',
  },
  Roboto: {
    regular: '/fonts/Roboto-Regular.ttf',
    bold: '/fonts/Roboto-Bold.ttf',
  },
  Outfit: {
    regular: '/fonts/Outfit-Regular.ttf',
    bold: '/fonts/Outfit-Bold.ttf',
  },
} as const;

/** Family names registered by this module. Useful for callers building styles. */
export const REGISTERED_FONT_FAMILIES = ['Inter', 'Roboto', 'Outfit'] as const;
export type RegisteredFontFamily = (typeof REGISTERED_FONT_FAMILIES)[number];

// Module-level guards so repeat imports don't redo the work. The primary
// registration is idempotent; the local fallback intentionally re-registers
// to overwrite the previous (failed) source list.
let primaryRegistered = false;
let lastRegistrationError: Error | null = null;

/**
 * Register all Vietnamese-capable fonts (CDN sources) with `@react-pdf/renderer`
 * and disable hyphenation. Idempotent: subsequent calls are no-ops.
 *
 * Called automatically at the bottom of this module so any importer triggers
 * registration immediately. Safe to call again from a component effect (for
 * example after lazy-loading the PDF chunk) without double-registering.
 *
 * Errors during synchronous registration are caught and logged via
 * `console.error` so the editor never crashes; the captured error is also
 * available via `getFontRegistrationError()` for diagnostics.
 */
export function registerCvFonts(): void {
  if (primaryRegistered) return;
  try {
    for (const family of REGISTERED_FONT_FAMILIES) {
      const sources = CDN_FONT_SOURCES[family];
      Font.register({
        family,
        fonts: [
          { src: sources.regular },
          { src: sources.bold, fontWeight: 'bold' },
        ],
      });
    }
    // Treat each word as atomic so Vietnamese syllables are not broken.
    Font.registerHyphenationCallback((word: string) => [word]);
    primaryRegistered = true;
  } catch (err) {
    lastRegistrationError = err instanceof Error ? err : new Error(String(err));
    // Graceful error logging — do not throw, because the editor must keep
    // working even if `@react-pdf/renderer` is in an unexpected state.
    // Templates can fall back to `ULTIMATE_FALLBACK_FONT`.
    // eslint-disable-next-line no-console
    console.error(
      '[cv-builder/pdf-fonts] Failed to register CV fonts from CDN; falling back at render time.',
      lastRegistrationError,
    );
  }
}

/**
 * Backwards-compatible alias retained for any existing import sites that
 * predate the rename to `registerCvFonts`. Newer code should prefer the
 * shorter name.
 *
 * @deprecated Use {@link registerCvFonts} instead.
 */
export const registerCvBuilderFonts = registerCvFonts;

/**
 * Re-register the same families using local TTF files in
 * `apps/web/public/fonts/`. Call this when the CDN probe detects an outage
 * or when running offline. Subsequent `Font.register` calls overwrite the
 * previous source list for the same family.
 *
 * Safe to call even if the local files are missing — react-pdf will simply
 * fail at render time and surface its own error, at which point the caller
 * should fall back to `ULTIMATE_FALLBACK_FONT`.
 */
export function registerLocalFallbackFonts(): void {
  try {
    for (const family of REGISTERED_FONT_FAMILIES) {
      const sources = LOCAL_FONT_PATHS[family];
      Font.register({
        family,
        fonts: [
          { src: sources.regular },
          { src: sources.bold, fontWeight: 'bold' },
        ],
      });
    }
    Font.registerHyphenationCallback((word: string) => [word]);
  } catch (err) {
    lastRegistrationError = err instanceof Error ? err : new Error(String(err));
    // eslint-disable-next-line no-console
    console.error(
      '[cv-builder/pdf-fonts] Failed to register local fallback fonts.',
      lastRegistrationError,
    );
  }
}

/**
 * Returns the most recent error captured during registration, or `null`.
 * Note: this only covers synchronous registration errors, NOT lazy network
 * failures during PDF rendering — see module docstring.
 */
export function getFontRegistrationError(): Error | null {
  return lastRegistrationError;
}

export type FontLoadStatus = 'loading' | 'loaded' | 'error';

/**
 * Best-effort hook that probes whether the Google Fonts CDN URLs are
 * reachable from the user's browser. Returns:
 *   - 'loading' while the probe is in flight (initial render)
 *   - 'loaded'  when every TTF responded successfully
 *   - 'error'   when at least one TTF failed (network error or non-2xx)
 *
 * Caveat: this hook does NOT guarantee the actual PDF render will succeed.
 * `@react-pdf/renderer` fetches each font lazily during render, so a CDN
 * outage that begins between the probe and the render will still cause a
 * render-time failure. The hook also auto-triggers
 * `registerLocalFallbackFonts()` on probe failure so the next render
 * attempt has a higher chance of succeeding.
 *
 * Consumers should display `FONT_FALLBACK_USER_MESSAGE` when the status is
 * `'error'`.
 */
export function useFontLoadStatus(): FontLoadStatus {
  const [status, setStatus] = useState<FontLoadStatus>('loading');

  useEffect(() => {
    let cancelled = false;

    async function probe(): Promise<void> {
      const urls: string[] = [];
      for (const family of REGISTERED_FONT_FAMILIES) {
        const sources = CDN_FONT_SOURCES[family];
        urls.push(sources.regular, sources.bold);
      }
      try {
        const results = await Promise.all(
          urls.map(async (url) => {
            try {
              const res = await fetch(url, { method: 'HEAD' });
              return res.ok;
            } catch {
              return false;
            }
          }),
        );
        if (cancelled) return;
        if (results.every(Boolean)) {
          setStatus('loaded');
        } else {
          // eslint-disable-next-line no-console
          console.error(
            '[cv-builder/pdf-fonts] Google Fonts CDN probe failed for one or more font URLs; switching to local fallback.',
          );
          setStatus('error');
          registerLocalFallbackFonts();
        }
      } catch (err) {
        if (cancelled) return;
        // eslint-disable-next-line no-console
        console.error(
          '[cv-builder/pdf-fonts] Unexpected error during font CDN probe; switching to local fallback.',
          err,
        );
        setStatus('error');
        registerLocalFallbackFonts();
      }
    }

    void probe();
    return () => {
      cancelled = true;
    };
  }, []);

  return status;
}

// Trigger registration as soon as this module is imported. This keeps the
// API simple: any code that touches the PDF chunk implicitly registers
// fonts. The guard inside `registerCvFonts` makes this safe under HMR and
// repeat imports.
registerCvFonts();
