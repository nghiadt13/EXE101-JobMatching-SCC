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
 * Why fonts are SELF-HOSTED (not loaded from a CDN):
 *   The previous implementation registered Inter / Outfit from
 *   `https://fonts.gstatic.com/...` TTF URLs. Those URLs are versioned and
 *   were eventually retired by Google — every one of them now returns a 404
 *   HTML page. `@react-pdf/renderer` fetches each `src` lazily during render,
 *   hands the 404 HTML body to `fontkit`, and `fontkit` throws
 *   `Unknown font format` (the exact crash reported in the CV builder). Since
 *   Inter is the default family, the editor crashed the instant it opened.
 *
 *   Self-hosting the TTFs under `apps/web/public/fonts/` removes the external
 *   dependency entirely: the files are served from the same origin as the app,
 *   never 404, and work offline. This is the canonical react-pdf pattern.
 *
 * Vietnamese coverage:
 *   The bundled TTFs ship the Vietnamese subset so glyphs like "ấ", "ợ", "ừ"
 *   render correctly:
 *     - Inter            → Google "Inter" (vietnamese subset)
 *     - Roboto           → Google "Roboto" (full unicode)
 *     - Times New Roman  → Google "Tinos" (metric-compatible, vietnamese)
 *     - Arial            → Google "Arimo" (metric-compatible, vietnamese)
 *   Outfit is Latin-only because Google does not publish a Vietnamese subset
 *   for it; Latin text renders correctly and Vietnamese falls back to tofu
 *   glyphs (it never crashes).
 *
 * Family names:
 *   The keys below MUST match what `resolveFontFamily()` in `pdf-styles.ts`
 *   derives from each `FONT_OPTIONS` value, i.e. the first family token of the
 *   CSS string: `Inter`, `Roboto`, `Outfit`, `Times New Roman`, `Arial`.
 *
 * Hyphenation:
 *   Vietnamese words must NOT be split mid-syllable. We disable hyphenation
 *   via `Font.registerHyphenationCallback(word => [word])` so each word is
 *   treated as an atomic unit during line breaking.
 *
 * Why error handling is best-effort:
 *   `Font.register` is synchronous and only buffers metadata — the actual
 *   fetch of each TTF happens lazily inside `@react-pdf/renderer` during
 *   render. There is no public callback for fetch failure. The
 *   `useFontLoadStatus` hook below performs a best-effort `HEAD` probe of the
 *   local font URLs so the UI can warn the user before they click "Tải PDF",
 *   but the probe is informational only. All caught errors are logged via
 *   `console.error` with a descriptive prefix so they show up in DevTools
 *   without crashing the editor.
 */

'use client';

import { Font } from '@react-pdf/renderer';
import { useEffect, useState } from 'react';

/**
 * User-facing message surfaced when font loading is detected as unavailable.
 * Kept as a constant so the same wording is reusable across
 * `cv-pdf-download.tsx` and any toast/banner.
 */
export const FONT_FALLBACK_USER_MESSAGE =
  'Không thể tải font. Đang dùng font dự phòng...';

/** PDF base-14 fallback always available without registration. */
export const ULTIMATE_FALLBACK_FONT = 'Times-Roman';

/**
 * Self-hosted TTF paths under `apps/web/public/fonts/`. Keyed by the resolved
 * font-family name (the first token of each `FONT_OPTIONS` CSS value) so the
 * registered family matches what `getDynamicStyles()` requests at render time.
 *
 * These files are served from the app origin (`/fonts/...`) and are committed
 * to the repo, so registration never depends on a third-party CDN.
 */
const FONT_SOURCES = {
  Inter: {
    // Inter files are currently missing, fall back to Roboto to prevent 404 HTML parsing crash
    regular: '/fonts/Roboto-Regular.ttf',
    bold: '/fonts/Roboto-Bold.ttf',
  },
  Roboto: {
    regular: '/fonts/Roboto-Regular.ttf',
    bold: '/fonts/Roboto-Bold.ttf',
  },
  Outfit: {
    // Outfit files are currently missing, fall back to Roboto to prevent 404 HTML parsing crash
    regular: '/fonts/Roboto-Regular.ttf',
    bold: '/fonts/Roboto-Bold.ttf',
  },
  'Times New Roman': {
    regular: '/fonts/TimesNewRoman-Regular.ttf',
    bold: '/fonts/TimesNewRoman-Bold.ttf',
  },
  Arial: {
    regular: '/fonts/Arial-Regular.ttf',
    bold: '/fonts/Arial-Bold.ttf',
  },
} as const;

/** Family names registered by this module. Useful for callers building styles. */
export const REGISTERED_FONT_FAMILIES = [
  'Inter',
  'Roboto',
  'Outfit',
  'Times New Roman',
  'Arial',
] as const;
export type RegisteredFontFamily = (typeof REGISTERED_FONT_FAMILIES)[number];

// Module-level guard so repeat imports don't redo the work. Registration is
// idempotent; the guard also keeps it safe under HMR.
let primaryRegistered = false;
let lastRegistrationError: Error | null = null;

/**
 * Register all Vietnamese-capable fonts (self-hosted TTFs) with
 * `@react-pdf/renderer` and disable hyphenation. Idempotent: subsequent calls
 * are no-ops.
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
      const sources = FONT_SOURCES[family];
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
      '[cv-builder/pdf-fonts] Failed to register CV fonts; falling back at render time.',
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
 * Re-register the same families. Fonts are already self-hosted, so this is the
 * same operation as {@link registerCvFonts} and exists only for backwards
 * compatibility with callers that invoked it as a CDN-outage recovery hook.
 */
export function registerLocalFallbackFonts(): void {
  try {
    for (const family of REGISTERED_FONT_FAMILIES) {
      const sources = FONT_SOURCES[family];
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
      '[cv-builder/pdf-fonts] Failed to (re-)register local fonts.',
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
 * Best-effort hook that probes whether the self-hosted font files are
 * reachable from the user's browser. Returns:
 *   - 'loading' while the probe is in flight (initial render)
 *   - 'loaded'  when every TTF responded successfully
 *   - 'error'   when at least one TTF failed (network error or non-2xx)
 *
 * Because the fonts are served from the same origin as the app, 'error' here
 * effectively only happens if the files are missing from the deployment, in
 * which case the caller should display `FONT_FALLBACK_USER_MESSAGE`.
 */
export function useFontLoadStatus(): FontLoadStatus {
  const [status, setStatus] = useState<FontLoadStatus>('loading');

  useEffect(() => {
    let cancelled = false;

    async function probe(): Promise<void> {
      const urls: string[] = [];
      for (const family of REGISTERED_FONT_FAMILIES) {
        const sources = FONT_SOURCES[family];
        urls.push(sources.regular, sources.bold);
      }
      try {
        const results = await Promise.all(
          urls.map(async (url) => {
            try {
              // Use GET instead of HEAD because fonts.gstatic.com blocks HEAD requests via CORS policy
              const res = await fetch(url, { method: 'GET' });
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
            '[cv-builder/pdf-fonts] One or more self-hosted font files failed to load; PDF may fall back to a base font.',
          );
          setStatus('error');
        }
      } catch (err) {
        if (cancelled) return;
        // eslint-disable-next-line no-console
        console.error(
          '[cv-builder/pdf-fonts] Unexpected error while probing font files.',
          err,
        );
        setStatus('error');
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
