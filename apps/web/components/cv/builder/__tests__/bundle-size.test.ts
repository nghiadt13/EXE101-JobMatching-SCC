/**
 * bundle-size.test.ts — Static-analysis assertion that the CV Builder 2.0
 * workspace shell never pulls `@react-pdf/renderer` into the main page
 * chunk.
 *
 * The assertion is intentionally STATIC (string-based on the source file)
 * rather than executing a full `next build` for two reasons:
 *
 *   1. `next build` is multi-minute and not always available in CI envs
 *      that exercise this Vitest suite.
 *   2. The lazy-loading contract is structural: it lives in the import
 *      statements of `cv-builder-page.tsx`. We can prove the contract by
 *      inspecting those imports directly.
 *
 * The contract:
 *   - `cv-builder-page.tsx` MUST NOT statically import
 *     `@react-pdf/renderer` (otherwise the package lands in the main
 *     chunk).
 *   - `cv-builder-page.tsx` MUST NOT statically import the
 *     `./pdf/resume-pdf` module (which itself imports
 *     `@react-pdf/renderer`).
 *   - `cv-builder-page.tsx` MUST reference `./cv-pdf-download` only
 *     through `next/dynamic` with `ssr: false` — that is the lazy
 *     boundary that isolates `@react-pdf/renderer` into its own chunk.
 *   - `cv-pdf-download.tsx` IS the lazy boundary, so it is allowed (and
 *     in fact required) to statically import `@react-pdf/renderer`.
 *
 * Validates: Requirements 12.3, 12.4, 12.5.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Bundle size: PDF chunk is lazy-loaded only', () => {
  const pageSrc = readFileSync(
    resolve(__dirname, '../cv-builder-page.tsx'),
    'utf8',
  );

  it('cv-builder-page does NOT statically import @react-pdf/renderer', () => {
    // Match: `import ... from '@react-pdf/renderer'` (single or double quotes)
    expect(pageSrc).not.toMatch(
      /^\s*import\b[^;]*from\s+['"]@react-pdf\/renderer['"]/m,
    );
  });

  it('cv-builder-page does NOT statically import resume-pdf', () => {
    // Match a static import of './pdf/resume-pdf' or './pdf/resume-pdf.tsx'
    expect(pageSrc).not.toMatch(
      /^\s*import\b[^;]*from\s+['"][^'"]*\/pdf\/resume-pdf['"]/m,
    );
  });

  it('cv-builder-page uses next/dynamic to lazy-load cv-pdf-download', () => {
    // The dynamic import inside cv-builder-page.tsx is the lazy boundary.
    expect(pageSrc).toMatch(
      /dynamic\(\s*\(\)\s*=>\s*import\(['"]\.\/cv-pdf-download['"]/,
    );
    expect(pageSrc).toMatch(/ssr:\s*false/);
  });

  it('cv-pdf-download IS the lazy boundary (allowed to import @react-pdf/renderer)', () => {
    const downloadSrc = readFileSync(
      resolve(__dirname, '../cv-pdf-download.tsx'),
      'utf8',
    );
    expect(downloadSrc).toMatch(/from\s+['"]@react-pdf\/renderer['"]/);
  });
});
