'use client';

import {
  type CSSProperties,
  type RefObject,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  DEFAULT_DESIGN_TOKENS,
  type CvBuilderData,
  type CvDesignTokens,
} from '@/types/cv-builder';
import {
  A4_PIXEL_HEIGHT,
  A4_PIXEL_WIDTH,
} from '@/types/cv-builder-constants';

import {
  ModernTemplate,
  ProfessionalTemplate,
  SimpleTemplate,
} from './html-templates';

/**
 * Props for {@link CvHtmlCanvas}.
 */
export interface CvHtmlCanvasProps {
  /** Current CV data driving the canvas render. */
  data: CvBuilderData;
  /**
   * Callback invoked by inline editors / block overlays inside the chosen
   * template whenever the CV data is mutated.
   */
  onChange: (updated: CvBuilderData) => void;
  /**
   * Zoom factor applied to the canvas root via `transform: scale(...)`.
   * Expected to be clamped to {@link ZOOM_RANGE} (0.6 – 1.3) by the caller.
   */
  zoom: number;
}

/**
 * Shape of the inline `style` object produced by {@link tokensToCanvasStyle}.
 *
 * Declaring the five CSS Custom Properties via an interface makes the keys
 * type-checked at the call site and stops `style.fontFamily` style props from
 * accidentally being substituted instead of the `--cv-font-family` variable.
 *
 * The trailing `[key: string]: ...` index signature lets us safely include
 * `transform` and `transformOrigin` alongside the custom properties without
 * widening to `any`.
 */
type CanvasRootStyle = CSSProperties & {
  '--cv-font-family': string;
  '--cv-base-font-size': string;
  '--cv-line-height': string;
  '--cv-primary-color': string;
  '--cv-page-margin': string;
};

/**
 * Build the inline `style` for the canvas root that exposes the five design
 * tokens as CSS Custom Properties and applies the user-controlled zoom level.
 *
 * Returned properties:
 * - `--cv-font-family`     ← `tokens.fontFamily`
 * - `--cv-base-font-size`  ← `${tokens.fontSize}px`
 * - `--cv-line-height`     ← `tokens.lineHeight` (string, unitless)
 * - `--cv-primary-color`   ← `tokens.primaryColor`
 * - `--cv-page-margin`     ← `${tokens.pageMargin}px`
 * - `transform`            ← `scale(${zoom})`
 * - `transformOrigin`      ← `'top center'`
 *
 * Variable names follow Requirement 5.1 (`--cv-base-font-size`) so that the
 * templates and Property 5 (token-to-style surjection) align on a single
 * lexicon. Templates consume the variables via `var(--cv-…)` references.
 */
export function tokensToCanvasStyle(
  tokens: CvDesignTokens,
  zoom: number,
): CSSProperties {
  const style: CanvasRootStyle = {
    '--cv-font-family': tokens.fontFamily,
    '--cv-base-font-size': `${tokens.fontSize}px`,
    '--cv-line-height': String(tokens.lineHeight),
    '--cv-primary-color': tokens.primaryColor,
    '--cv-page-margin': `${tokens.pageMargin}px`,
    transform: `scale(${zoom})`,
    transformOrigin: 'top center',
  };
  return style;
}

/**
 * Watches the canvas page element and reports whether its rendered content
 * exceeds the height of a single A4 page (`A4_PIXEL_HEIGHT`).
 *
 * Uses `ResizeObserver` so updates are event-driven (no polling). Falls back
 * to a single synchronous check when `ResizeObserver` is unavailable, e.g. in
 * older test environments.
 *
 * Implements Requirements 5.5 (show indicator on overflow) and 5.6 (hide
 * indicator automatically once the content fits within A4).
 */
export function useOverflowIndicator(
  pageRef: RefObject<HTMLDivElement | null>,
): boolean {
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const el = pageRef.current;
    if (!el) return;

    const measure = () => {
      setIsOverflowing(el.scrollHeight > A4_PIXEL_HEIGHT);
    };

    // Initial synchronous measurement so the indicator reflects the current
    // height even before the first ResizeObserver callback fires.
    measure();

    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [pageRef]);

  return isOverflowing;
}

/**
 * `CvHtmlCanvas` is the centre panel of the CV Builder 2.0 workspace. It
 * mirrors a real A4 sheet (794 × 1123 px @ 96 DPI) and exposes the active
 * design tokens as CSS Custom Properties on its root element so the templates
 * underneath repaint in response to slider changes without React having to
 * reconcile their entire tree (Requirements 5.1, 5.3).
 *
 * Behaviour:
 * - Wraps `data` in `React.useDeferredValue` so heavy template re-renders
 *   never block input events fired by the inline editors (Requirement 5.4).
 * - Falls back to {@link DEFAULT_DESIGN_TOKENS} when `data.designTokens` is
 *   absent (legacy CVs from before v2.0).
 * - Applies `transform: scale(zoom)` with `transform-origin: top center` to
 *   the root element so the page scales around its top edge (Requirement 5.2).
 * - Renders the A4 page as a fixed-width, minimum-height container so the
 *   PDF parity stays 1:1 with the on-screen preview.
 * - Watches the page via `ResizeObserver` and shows a red dotted line plus
 *   tooltip when the rendered content exceeds 1123 px high (Requirements 5.5,
 *   5.6).
 * - Switches on `data.templateId` and dispatches to the matching template
 *   component (`SimpleTemplate`, `ProfessionalTemplate`, `ModernTemplate`).
 *   Each template receives `{ data, onChange }` so inline edits flow back
 *   through the parent (Requirements 8.1, 8.2, 8.3).
 */
export function CvHtmlCanvas({ data, onChange, zoom }: CvHtmlCanvasProps) {
  // useDeferredValue lets React keep input handlers responsive: if a slow
  // render is in progress, urgent updates (typing) interrupt and finish
  // first, while the deferred render of the canvas catches up afterwards.
  const deferredData = useDeferredValue(data);
  const tokens = deferredData.designTokens ?? DEFAULT_DESIGN_TOKENS;

  // Memoise the inline style so the object reference only changes when the
  // tokens or zoom actually change. This keeps DOM diffing cheap during
  // unrelated re-renders.
  const rootStyle = useMemo(
    () => tokensToCanvasStyle(tokens, zoom),
    [tokens, zoom],
  );

  // Ref attached to the inner page div — that is the element whose
  // `scrollHeight` represents the rendered CV content height.
  const pageRef = useRef<HTMLDivElement | null>(null);
  const isOverflowing = useOverflowIndicator(pageRef);

  return (
    <div
      className="cv-canvas-root"
      style={rootStyle}
      data-testid="cv-html-canvas-root"
    >
      <div
        ref={pageRef}
        className="cv-canvas-page relative mx-auto bg-white text-zinc-900 shadow-lg"
        style={{
          width: A4_PIXEL_WIDTH,
          minHeight: A4_PIXEL_HEIGHT,
          // Each of these properties consumes a CSS Custom Property defined
          // on the canvas root, so slider drags repaint without touching
          // React state.
          fontFamily: 'var(--cv-font-family)',
          fontSize: 'var(--cv-base-font-size)',
          lineHeight: 'var(--cv-line-height)',
          padding: 'var(--cv-page-margin)',
        }}
        data-testid="cv-canvas-page"
      >
        <CanvasTemplate data={deferredData} onChange={onChange} />

        {isOverflowing ? <OverflowIndicator /> : null}
      </div>
    </div>
  );
}

/**
 * Switches on `data.templateId` and renders the matching template.
 *
 * The real `SimpleTemplate`, `ProfessionalTemplate`, and `ModernTemplate`
 * components share a single `{ data, onChange }` contract, so the dispatch
 * here is a flat switch with no extra adaptation needed. An unknown
 * `templateId` falls back to `SimpleTemplate` as a defensive default
 * (Requirement 8.1) so the editor never crashes on stale or corrupted data.
 */
function CanvasTemplate({
  data,
  onChange,
}: {
  data: CvBuilderData;
  onChange: (updated: CvBuilderData) => void;
}) {
  switch (data.templateId) {
    case 'simple':
      return <SimpleTemplate data={data} onChange={onChange} />;
    case 'professional':
      return <ProfessionalTemplate data={data} onChange={onChange} />;
    case 'modern':
      return <ModernTemplate data={data} onChange={onChange} />;
    default:
      // Defensive fallback: an unknown templateId should still render
      // something sensible rather than crashing the whole editor.
      return <SimpleTemplate data={data} onChange={onChange} />;
  }
}

/**
 * Page-overflow visual indicator: a red dotted line drawn at the 1123 px
 * mark plus a tooltip explaining the consequence to the user.
 *
 * Rendered absolutely inside the page element so it stays at the A4
 * boundary regardless of the actual content height. `pointer-events-none`
 * keeps it from blocking inline editing on text rendered just below the
 * fold.
 */
function OverflowIndicator() {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-x-0 border-t-2 border-dotted border-red-500"
        style={{ top: A4_PIXEL_HEIGHT }}
        role="separator"
        aria-label="Đường giới hạn trang A4"
        data-testid="cv-canvas-overflow-line"
      />
      <div
        className="absolute right-2 z-20 max-w-[280px] rounded-md bg-red-50 px-3 py-2 text-xs text-red-700 shadow-sm ring-1 ring-red-200"
        style={{ top: A4_PIXEL_HEIGHT + 8 }}
        role="tooltip"
        data-testid="cv-canvas-overflow-tooltip"
      >
        Nội dung hiện vượt quá 1 trang A4 chuẩn. Một số chữ có thể bị cắt khi
        xuất PDF.
      </div>
    </>
  );
}
