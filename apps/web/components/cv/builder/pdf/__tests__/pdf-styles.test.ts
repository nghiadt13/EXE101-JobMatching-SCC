/**
 * pdf-styles.test.ts — Property 7: PDF / HTML Style Parity (Smoke).
 *
 * Validates: Requirements 13.1, 13.2, 13.3, 13.4
 *
 * For any valid `tokens`, `getDynamicStyles(tokens)` must produce a
 * StyleSheet whose page-level fields mirror the design tokens used to drive
 * the on-canvas HTML preview. This guarantees the user sees the same
 * spacing, font size, line height, and accent colour in the exported PDF
 * that they configured in the editor.
 *
 * `@react-pdf/renderer` imports are stubbed at the top of this file because
 * the real package eagerly attempts to load fonts and resolve filesystem
 * paths at module load, which jsdom cannot satisfy.
 */

import { vi, describe, it, expect } from 'vitest';

vi.mock('@react-pdf/renderer', () => ({
  StyleSheet: { create: <T,>(s: T) => s },
  Font: {
    register: () => {},
    registerHyphenationCallback: () => {},
  },
}));

import * as fc from 'fast-check';

import { getDynamicStyles, resolveFontFamily } from '../pdf-styles';

const tokensArb = fc.record({
  fontFamily: fc.constantFrom(
    'Inter, sans-serif',
    'Roboto, sans-serif',
    'Outfit, sans-serif',
  ),
  fontSize: fc.integer({ min: 10, max: 16 }),
  lineHeight: fc.float({
    min: Math.fround(1.2),
    max: Math.fround(2.0),
    noNaN: true,
  }),
  primaryColor: fc.constantFrom('#0f172a', '#1e40af', '#7c3aed'),
  pageMargin: fc.integer({ min: 20, max: 60 }),
});

describe('getDynamicStyles (Property 7: PDF/HTML parity)', () => {
  it('mirrors design tokens into the StyleSheet', () => {
    fc.assert(
      fc.property(tokensArb, (tokens) => {
        const styles = getDynamicStyles(tokens) as any;
        expect(styles.page.fontSize).toBe(tokens.fontSize);
        expect(styles.page.padding).toBe(tokens.pageMargin);
        expect(styles.page.lineHeight).toBe(tokens.lineHeight);
        expect(styles.sectionTitle.color).toBe(tokens.primaryColor);
      }),
    );
  });

  it('resolveFontFamily extracts first family from CSS string', () => {
    expect(resolveFontFamily('Inter, sans-serif')).toBe('Inter');
    expect(resolveFontFamily('"Times New Roman", serif')).toBe(
      'Times New Roman',
    );
    expect(resolveFontFamily("  'Helvetica' , sans-serif")).toBe('Helvetica');
  });
});
