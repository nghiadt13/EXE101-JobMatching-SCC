/**
 * cv-pdf-download.test.ts — Unit tests for PDF download wiring.
 *
 * Validates: Requirements 10.1, 10.4, 12.3
 *
 * Two contracts are pinned here:
 *   1. {@link buildPdfFileName} sanitises Unicode + whitespace into a
 *      filesystem-safe `CV-<slug>.pdf` (or `CV.pdf` when nothing useful
 *      remains). This is the single source of truth for the download
 *      filename surfaced to browsers.
 *   2. The workspace shell (`cv-builder-page.tsx`) loads
 *      `cv-pdf-download` via `next/dynamic` with `{ ssr: false }`, so the
 *      ~200 KB `@react-pdf/renderer` chunk never enters the main edit-page
 *      bundle. We assert this by reading the source file and matching the
 *      dynamic-import call shape.
 *
 * `@react-pdf/renderer` and the heavy `./pdf/resume-pdf` tree are stubbed
 * because importing the real modules in jsdom triggers font registration
 * and filesystem lookups that have no equivalent in the test environment.
 */

import { vi, describe, it, expect } from 'vitest';

vi.mock('@react-pdf/renderer', () => ({
  PDFDownloadLink: () => null,
  Font: {
    register: () => {},
    registerHyphenationCallback: () => {},
  },
  StyleSheet: { create: <T,>(s: T) => s },
}));

vi.mock('../pdf/resume-pdf', () => ({
  ResumePDF: () => null,
}));

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { buildPdfFileName } from '../cv-pdf-download';

describe('buildPdfFileName', () => {
  it.each<[string | undefined, string]>([
    [undefined, 'CV.pdf'],
    ['', 'CV.pdf'],
    ['   ', 'CV.pdf'],
    ['Jane Doe', 'CV-Jane-Doe.pdf'],
    ['  Jane   Doe  ', 'CV-Jane-Doe.pdf'],
    ['Nguyễn Văn An', 'CV-Nguyn-Vn-An.pdf'],
    ['***', 'CV.pdf'],
  ])('builds correct filename for %j', (input, expected) => {
    expect(buildPdfFileName(input)).toBe(expected);
  });
});

describe('cv-builder-page lazy loads PDF chunk', () => {
  it('uses next/dynamic with ssr: false to import cv-pdf-download', () => {
    const src = readFileSync(
      resolve(__dirname, '../cv-builder-page.tsx'),
      'utf8',
    );
    expect(src).toMatch(/dynamic\(/);
    expect(src).toMatch(/import\(['"]\.\/cv-pdf-download['"]\)/);
    expect(src).toMatch(/ssr:\s*false/);
  });
});
