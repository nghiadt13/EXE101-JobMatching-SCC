import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
} from 'vitest';
import * as fc from 'fast-check';
import { render, screen } from '@testing-library/react';

import {
  CvHtmlCanvas,
  tokensToCanvasStyle,
} from '../cv-html-canvas';
import type { CvBuilderData } from '@/types/cv-builder';
import { A4_PIXEL_HEIGHT } from '@/types/cv-builder-constants';

/**
 * Tests for {@link CvHtmlCanvas} covering two concerns:
 *
 * 1. **Property 5: Token-to-Style Surjection** (Task 2.10) — the inline
 *    `style` object returned by {@link tokensToCanvasStyle} must always
 *    expose all five `--cv-…` CSS Custom Properties plus the transform pair
 *    so the templates underneath can reliably read them.
 *
 * 2. **Page overflow indicator** (Task 2.11) — the canvas must render the
 *    red dotted line when its content height exceeds A4 (1123px) and hide
 *    it once the content fits, satisfying Requirements 5.5 and 5.6.
 */

// ---------------------------------------------------------------------------
// jsdom doesn't ship `ResizeObserver`. The hook only needs `observe` /
// `disconnect` to be callable, so a no-op stub is sufficient — the actual
// height read is driven by the synchronous `measure()` that fires on mount.
// ---------------------------------------------------------------------------
class FakeResizeObserver {
  callback: ResizeObserverCallback;
  constructor(cb: ResizeObserverCallback) {
    this.callback = cb;
  }
  observe() {}
  disconnect() {}
  unobserve() {}
}

const sampleData: CvBuilderData = {
  templateId: 'simple',
  designTokens: {
    fontFamily: 'Inter, sans-serif',
    fontSize: 12,
    lineHeight: 1.5,
    primaryColor: '#0f172a',
    pageMargin: 40,
  },
  profile: { name: 'Test' },
  experience: [],
  education: [],
  skills: [],
  projects: [],
  certifications: [],
  languages: [],
};

// ===========================================================================
// Property 5: Token-to-Style Surjection
// ===========================================================================

describe('tokensToCanvasStyle (Property 5: Token-to-Style Surjection)', () => {
  /**
   * Generator constrained to the canonical token domain enforced by the
   * Design Sidebar sliders and the backend `CvDesignTokensDto` validators.
   * Using `constantFrom` for the string-typed fields keeps the property
   * focused on the surjection invariant rather than string fuzzing.
   */
  // fast-check 3.x requires 32-bit float bounds for `fc.float`. Wrap the
  // double-precision bounds with `Math.fround` so the generator accepts them.
  const tokensArb = fc.record({
    fontFamily: fc.constantFrom('Inter, sans-serif', 'Roboto, sans-serif'),
    fontSize: fc.integer({ min: 10, max: 16 }),
    lineHeight: fc.float({
      min: Math.fround(1.2),
      max: Math.fround(2.0),
      noNaN: true,
    }),
    primaryColor: fc.constantFrom('#0f172a', '#1e40af', '#7c3aed'),
    pageMargin: fc.integer({ min: 20, max: 60 }),
  });

  /**
   * **Validates: Requirements 5.1, 5.2**
   *
   * For any well-formed `tokens` and any zoom in `[0.6, 1.3]`, the returned
   * style object must contain all five `--cv-*` CSS Custom Properties plus
   * `transform` and `transformOrigin`, with each value derived directly
   * from the inputs. This guarantees the template tree always finds the
   * variables it consumes via `var(--cv-…)` references.
   */
  it('Property 5: returns all 5 CSS variable keys for any tokens + zoom', () => {
    fc.assert(
      fc.property(
        tokensArb,
        fc.float({
          min: Math.fround(0.6),
          max: Math.fround(1.3),
          noNaN: true,
        }),
        (tokens, zoom) => {
          const style = tokensToCanvasStyle(tokens, zoom) as Record<
            string,
            unknown
          >;
          expect(style['--cv-font-family']).toBe(tokens.fontFamily);
          expect(style['--cv-base-font-size']).toBe(`${tokens.fontSize}px`);
          expect(style['--cv-line-height']).toBe(String(tokens.lineHeight));
          expect(style['--cv-primary-color']).toBe(tokens.primaryColor);
          expect(style['--cv-page-margin']).toBe(`${tokens.pageMargin}px`);
          expect(style.transform).toBe(`scale(${zoom})`);
          expect(style.transformOrigin).toBe('top center');
        },
      ),
    );
  });
});

// ===========================================================================
// Overflow indicator unit tests
// ===========================================================================

describe('CvHtmlCanvas overflow indicator (Requirements 5.5, 5.6)', () => {
  // Snapshot any pre-existing definitions so we leave the global environment
  // exactly as we found it once this suite finishes.
  let originalScrollHeight: PropertyDescriptor | undefined;
  let originalResizeObserver: typeof ResizeObserver | undefined;

  beforeAll(() => {
    originalScrollHeight = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      'scrollHeight',
    );
    originalResizeObserver = (globalThis as { ResizeObserver?: typeof ResizeObserver })
      .ResizeObserver;
    (globalThis as unknown as { ResizeObserver: typeof FakeResizeObserver })
      .ResizeObserver = FakeResizeObserver;
  });

  afterAll(() => {
    if (originalScrollHeight) {
      Object.defineProperty(
        HTMLElement.prototype,
        'scrollHeight',
        originalScrollHeight,
      );
    } else {
      // jsdom's default is non-configurable returning 0; if for some reason
      // the descriptor was missing we simply leave our stub in place rather
      // than risk throwing during teardown.
    }
    if (originalResizeObserver === undefined) {
      delete (globalThis as { ResizeObserver?: unknown }).ResizeObserver;
    } else {
      (globalThis as { ResizeObserver?: typeof ResizeObserver }).ResizeObserver =
        originalResizeObserver;
    }
  });

  /**
   * Override `HTMLElement.prototype.scrollHeight` to return a fixed value so
   * the hook's synchronous `measure()` call deterministically observes a
   * known content height regardless of jsdom's default `0`.
   */
  const stubScrollHeight = (value: number) => {
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
      configurable: true,
      get: () => value,
    });
  };

  it('shows the overflow line when scrollHeight exceeds A4_PIXEL_HEIGHT', () => {
    // 2000 > 1123 (A4_PIXEL_HEIGHT) → indicator should mount.
    stubScrollHeight(2000);

    render(
      <CvHtmlCanvas data={sampleData} onChange={() => {}} zoom={1} />,
    );

    // Sanity: the canvas itself renders before we assert on the indicator.
    expect(screen.getByTestId('cv-canvas-page')).toBeInTheDocument();
    expect(screen.getByTestId('cv-canvas-overflow-line')).toBeInTheDocument();
    // The accessible label backs the `role="separator"` so screen-reader users
    // also get the warning, not just sighted users.
    expect(
      screen.getByLabelText('Đường giới hạn trang A4'),
    ).toBeInTheDocument();
  });

  it('hides the overflow line when scrollHeight fits within A4_PIXEL_HEIGHT', () => {
    // 500 ≤ 1123 (A4_PIXEL_HEIGHT) → indicator must stay hidden.
    stubScrollHeight(500);

    render(
      <CvHtmlCanvas data={sampleData} onChange={() => {}} zoom={1} />,
    );

    expect(screen.getByTestId('cv-canvas-page')).toBeInTheDocument();
    expect(screen.queryByTestId('cv-canvas-overflow-line')).toBeNull();
    expect(screen.queryByTestId('cv-canvas-overflow-tooltip')).toBeNull();
  });
});
