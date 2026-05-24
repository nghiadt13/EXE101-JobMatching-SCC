import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
} from 'vitest';
import * as fc from 'fast-check';
import { render } from '@testing-library/react';

import { CvHtmlCanvas } from '../cv-html-canvas';
import type { CvBuilderData, TemplateId } from '@/types/cv-builder';

/**
 * Tests for backwards compatibility on read (Task 8.6 — Property 10).
 *
 * Legacy CVs created before CV Builder 2.0 do not carry a `designTokens`
 * field. The canvas layer must transparently fall back to
 * `DEFAULT_DESIGN_TOKENS` (handled inside `CvHtmlCanvas`) so opening such a
 * CV in the new editor never crashes the page.
 */

// ---------------------------------------------------------------------------
// jsdom doesn't provide ResizeObserver. The overflow indicator hook only
// needs `observe` / `disconnect` to be callable, so a no-op stub is enough.
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

let originalResizeObserver: typeof ResizeObserver | undefined;

beforeAll(() => {
  originalResizeObserver = (
    globalThis as { ResizeObserver?: typeof ResizeObserver }
  ).ResizeObserver;
  (
    globalThis as unknown as { ResizeObserver: typeof FakeResizeObserver }
  ).ResizeObserver = FakeResizeObserver;
});

afterAll(() => {
  if (originalResizeObserver === undefined) {
    delete (globalThis as { ResizeObserver?: unknown }).ResizeObserver;
  } else {
    (
      globalThis as { ResizeObserver?: typeof ResizeObserver }
    ).ResizeObserver = originalResizeObserver;
  }
});

// ===========================================================================
// Generators for arbitrary "legacy" CV data (no designTokens field).
// ===========================================================================

/**
 * Short, mostly-printable string used wherever a free-form text field is
 * needed. The bound keeps the property check fast while still exercising
 * non-empty / empty cases.
 */
const shortString = fc.string({ maxLength: 24 });
const optionalShortString = fc.option(shortString, { nil: undefined });

/**
 * Arbitrary `CvBuilderData` that DELIBERATELY omits the `designTokens` key,
 * mimicking the on-disk shape of legacy CVs. We use 1..3 templates and a
 * small number of entries per repeating section so the property runs in
 * reasonable time without losing coverage of the merge-with-defaults path.
 */
const legacyDataArb: fc.Arbitrary<CvBuilderData> = fc
  .record({
    templateId: fc.constantFrom<TemplateId>(
      'simple',
      'professional',
      'modern',
    ),
    profile: fc.record({
      name: shortString,
      email: optionalShortString,
      phone: optionalShortString,
      website: optionalShortString,
      summary: optionalShortString,
    }),
    experience: fc.array(
      fc.record({
        role: shortString,
        company: shortString,
        startDate: shortString,
        endDate: optionalShortString,
        description: optionalShortString,
      }),
      { maxLength: 2 },
    ),
    education: fc.array(
      fc.record({
        school: shortString,
        degree: shortString,
        field: optionalShortString,
        startDate: optionalShortString,
        endDate: optionalShortString,
        gpa: optionalShortString,
      }),
      { maxLength: 2 },
    ),
    skills: fc.array(shortString, { maxLength: 4 }),
    projects: fc.array(
      fc.record({
        name: shortString,
        description: optionalShortString,
      }),
      { maxLength: 2 },
    ),
    certifications: fc.array(shortString, { maxLength: 3 }),
    languages: fc.array(shortString, { maxLength: 3 }),
  })
  .map((value) => value as CvBuilderData);

// ===========================================================================
// Property 10: Backwards Compatibility on Read
// ===========================================================================

describe('CvHtmlCanvas legacy data (Property 10: backwards compatibility)', () => {
  /**
   * **Validates: Requirement 7.10**
   *
   * Legacy `CvBuilderData` without `designTokens` should merge with
   * `DEFAULT_DESIGN_TOKENS` (handled inside `CvHtmlCanvas`) and render
   * without throwing. We probe the canvas root testid as a low-noise
   * "did the tree mount" assertion — if any descendant template threw on
   * `tokens.fontFamily.split(',')`, `tokens.primaryColor.startsWith(...)`,
   * etc., this query would return `null` and the test would fail.
   */
  it('Property 10: legacy data without designTokens renders without crashing', () => {
    fc.assert(
      fc.property(legacyDataArb, (data) => {
        // Sanity check on the generator itself: the property only holds
        // when the input is genuinely "legacy" (no designTokens).
        expect((data as { designTokens?: unknown }).designTokens).toBeUndefined();

        const { container, unmount } = render(
          <CvHtmlCanvas
            data={data}
            onChange={() => {
              /* no-op for the render-only check */
            }}
            zoom={1}
          />,
        );

        // The canvas root testid is rendered by `CvHtmlCanvas` regardless of
        // which template it dispatches to, so it's the most stable witness
        // that the entire tree mounted successfully.
        expect(
          container.querySelector('[data-testid="cv-html-canvas-root"]'),
        ).not.toBeNull();

        unmount();
      }),
      { numRuns: 25 },
    );
  });
});
