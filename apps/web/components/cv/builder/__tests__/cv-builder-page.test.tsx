/**
 * cv-builder-page.test.tsx — Unit tests for the CV Builder 2.0 workspace shell.
 *
 * Validates: Requirements 9.1, 9.2, 9.4, 9.5
 *
 * The workspace shell composes three panels (`SectionNav`, `CvHtmlCanvas`,
 * `DesignSidebar`) plus a floating zoom toolbar and a mobile design drawer.
 * Layout is driven by Tailwind's `hidden lg:block` classes — jsdom does not
 * enforce CSS, so the side-panel elements live in the DOM at every viewport
 * width. We therefore assert *presence* (Req 9.1) and that the mobile drawer
 * trigger + drawer container exist (Req 9.2).
 *
 * Zoom interactions are pure JS state transitions on `cvBuilderPage`:
 *   - The `[+]` and `[-]` toolbar buttons step zoom by `ZOOM_RANGE.step`
 *     (0.05) and clamp to `[0.6, 1.3]` (Req 9.4).
 *   - The "Vừa vặn" button computes `(midPanelWidth - 48) / A4_PIXEL_WIDTH`
 *     and snaps to the same 0.05 step (Req 9.5).
 *
 * Heavy / non-jsdom dependencies are stubbed at the module boundary:
 *   - `next/dynamic` returns a no-op placeholder so the lazy
 *     `cv-pdf-download` chunk (and `@react-pdf/renderer` ~200 KB) never
 *     loads.
 *   - `useAutoSave` is mocked to a stable record so debounce timers and
 *     fetch calls do not interfere with the synchronous zoom assertions.
 *   - `ResizeObserver` / `IntersectionObserver` are stubbed because jsdom
 *     does not provide them; the canvas overflow indicator and SectionNav
 *     active-section observer only need `observe`/`disconnect` to be
 *     callable.
 */

import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// `vi.mock` calls are hoisted above the imports — these stubs replace the
// real modules before `cv-builder-page.tsx` is evaluated.

// next/dynamic is the lazy boundary for `cv-pdf-download`. Replacing it
// with a tiny placeholder keeps `@react-pdf/renderer` out of the test
// bundle entirely.
vi.mock('next/dynamic', () => ({
  default: () => function PdfPlaceholder() {
    return null;
  },
}));

// useAutoSave is irrelevant to layout / zoom assertions; stub the hook so
// no debounce timers, REST clients, or `beforeunload` listeners run during
// the test.
vi.mock('@/hooks/use-auto-save', () => ({
  useAutoSave: () => ({
    saveStatus: 'saved',
    debouncedSave: () => {},
    retry: () => {},
    markDirty: () => {},
  }),
}));

import { CvBuilderPage } from '../cv-builder-page';
import {
  DEFAULT_DESIGN_TOKENS,
  EMPTY_CV_DATA,
  type CvBuilderData,
} from '@/types/cv-builder';

// ---------------------------------------------------------------------------
// Environment stubs (ResizeObserver, IntersectionObserver)
// ---------------------------------------------------------------------------

class FakeResizeObserver {
  observe() {}
  disconnect() {}
  unobserve() {}
}

class FakeIntersectionObserver {
  observe() {}
  disconnect() {}
  unobserve() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

let originalResizeObserver: typeof ResizeObserver | undefined;
let originalIntersectionObserver: typeof IntersectionObserver | undefined;
let originalScrollIntoView:
  | ((arg?: boolean | ScrollIntoViewOptions) => void)
  | undefined;

beforeAll(() => {
  originalResizeObserver = (
    globalThis as { ResizeObserver?: typeof ResizeObserver }
  ).ResizeObserver;
  (
    globalThis as unknown as { ResizeObserver: typeof FakeResizeObserver }
  ).ResizeObserver = FakeResizeObserver;

  originalIntersectionObserver = (
    globalThis as { IntersectionObserver?: typeof IntersectionObserver }
  ).IntersectionObserver;
  (
    globalThis as unknown as {
      IntersectionObserver: typeof FakeIntersectionObserver;
    }
  ).IntersectionObserver = FakeIntersectionObserver;

  originalScrollIntoView = Element.prototype.scrollIntoView;
  // SectionNav buttons call scrollIntoView when clicked — jsdom does not
  // implement it, so a no-op stub avoids ReferenceErrors during interactions.
  Element.prototype.scrollIntoView = function () {
    /* no-op */
  };
});

afterAll(() => {
  if (originalResizeObserver === undefined) {
    delete (globalThis as { ResizeObserver?: unknown }).ResizeObserver;
  } else {
    (
      globalThis as { ResizeObserver?: typeof ResizeObserver }
    ).ResizeObserver = originalResizeObserver;
  }

  if (originalIntersectionObserver === undefined) {
    delete (globalThis as { IntersectionObserver?: unknown })
      .IntersectionObserver;
  } else {
    (
      globalThis as { IntersectionObserver?: typeof IntersectionObserver }
    ).IntersectionObserver = originalIntersectionObserver;
  }

  if (originalScrollIntoView) {
    Element.prototype.scrollIntoView = originalScrollIntoView;
  }
});

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

/**
 * Minimal valid `CvBuilderData` used as the seed state for every test. We
 * spread `EMPTY_CV_DATA` so the structure stays in sync with future schema
 * changes and explicitly attach `DEFAULT_DESIGN_TOKENS` so the design
 * sidebar has a non-undefined token tree to render.
 */
const initialData: CvBuilderData = {
  ...EMPTY_CV_DATA,
  designTokens: { ...DEFAULT_DESIGN_TOKENS },
};

const noopSave = async (): Promise<string | null> => null;

/**
 * Render helper that always supplies the full prop list expected by
 * `CvBuilderPage`. Centralising the boilerplate keeps the individual tests
 * focused on the assertion under test.
 */
function renderPage() {
  return render(
    <CvBuilderPage
      initialData={initialData}
      cvId="cv-1"
      accessToken="token-1"
      onSave={noopSave}
    />,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CvBuilderPage layout (Requirement 9.1)', () => {
  it('renders SectionNav and DesignSidebar inside the workspace shell', () => {
    renderPage();

    // SectionNav is hidden via `hidden lg:block` at <1024 px — jsdom does
    // not enforce CSS, so the element is present in the DOM regardless.
    expect(screen.getByTestId('section-nav')).toBeInTheDocument();

    // DesignSidebar is rendered twice: once on the desktop right column
    // (hidden via Tailwind below 1024 px) and once inside the mobile
    // drawer container. Both instances share the same `data-testid`.
    expect(screen.getAllByTestId('design-sidebar').length).toBeGreaterThanOrEqual(
      1,
    );

    // The middle panel containing the canvas should also be present so we
    // know the three-column layout actually mounted.
    expect(screen.getByTestId('cv-builder-mid-panel')).toBeInTheDocument();
  });
});

describe('CvBuilderPage mobile drawer (Requirement 9.2)', () => {
  it('exposes the drawer trigger button and drawer container', async () => {
    const user = userEvent.setup();
    renderPage();

    // The floating "Thiết kế" button is the only entry point to the
    // drawer at <1024 px (hidden via `lg:hidden` on larger viewports).
    const trigger = screen.getByTestId('cv-builder-open-design-drawer');
    expect(trigger).toBeInTheDocument();

    const drawer = screen.getByTestId('cv-builder-design-drawer');
    expect(drawer).toBeInTheDocument();

    // Clicking the trigger should be a non-throwing interaction. We also
    // verify the drawer is still in the DOM afterwards (it is rendered at
    // all times — only its translate / aria-hidden flips).
    await user.click(trigger);
    expect(screen.getByTestId('cv-builder-design-drawer')).toBeInTheDocument();
  });
});

describe('CvBuilderPage zoom clamping (Requirement 9.4)', () => {
  it('clamps zoom-in to ZOOM_RANGE.max (1.3 → 130%)', async () => {
    const user = userEvent.setup();
    renderPage();

    const zoomIn = screen.getByTestId('zoom-in');

    // 15 clicks blow well past `(1.3 - 0.9) / 0.05 = 8` increments needed
    // to reach the upper bound. Once the button hits the disabled
    // threshold further clicks are no-ops, so the displayed percentage
    // should stabilise at 130 %.
    for (let i = 0; i < 15; i++) {
      // Disabled buttons are no-ops in user-event v14, so we tolerate
      // the clicks that occur after the threshold without throwing.
      // eslint-disable-next-line no-await-in-loop
      await user.click(zoomIn);
    }

    expect(screen.getByTestId('zoom-reset')).toHaveTextContent(/130%/);
  });

  it('clamps zoom-out to ZOOM_RANGE.min (0.6 → 60%)', async () => {
    const user = userEvent.setup();
    renderPage();

    const zoomOut = screen.getByTestId('zoom-out');

    // `(0.9 - 0.6) / 0.05 = 6` decrements brings us to the floor, but
    // clicking 20 times exercises the clamp safety net as well.
    for (let i = 0; i < 20; i++) {
      // eslint-disable-next-line no-await-in-loop
      await user.click(zoomOut);
    }

    expect(screen.getByTestId('zoom-reset')).toHaveTextContent(/60%/);
  });
});

describe('CvBuilderPage fit-to-width zoom (Requirement 9.5)', () => {
  // The fit calculation reads `midPanelRef.current.clientWidth`. jsdom
  // returns `0` for clientWidth on every element by default, so we override
  // the prototype getter for the duration of this suite to feed the handler
  // a deterministic panel width.
  let originalClientWidth: PropertyDescriptor | undefined;

  beforeEach(() => {
    originalClientWidth = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      'clientWidth',
    );
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      get: () => 1000,
    });
  });

  afterEach(() => {
    if (originalClientWidth) {
      Object.defineProperty(
        HTMLElement.prototype,
        'clientWidth',
        originalClientWidth,
      );
    } else {
      // Fall back to deleting the override so jsdom's default behaviour
      // (clientWidth = 0) is restored for any subsequent test file.
      delete (HTMLElement.prototype as unknown as { clientWidth?: number })
        .clientWidth;
    }
  });

  it('snaps the computed zoom to the nearest ZOOM_RANGE.step', async () => {
    const user = userEvent.setup();
    renderPage();

    // (1000 - 48) / 794 = 1.1989924... → snapped to nearest 0.05 step
    // Math.round(1.1989924 / 0.05) = 24 → 24 * 0.05 = 1.20 → 120 %.
    await user.click(screen.getByTestId('zoom-fit'));

    expect(screen.getByTestId('zoom-reset')).toHaveTextContent(/120%/);
  });
});
