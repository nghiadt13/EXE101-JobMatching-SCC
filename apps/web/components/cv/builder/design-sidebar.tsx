'use client';

import { useId, useState, type ChangeEvent } from 'react';
import { LayoutGrid, Type, Palette, Sliders, Paintbrush } from 'lucide-react';

import type { CvDesignTokens, TemplateId } from '@/types/cv-builder';
import { TEMPLATES } from '@/types/cv-builder';
import {
  COLOR_PRESETS,
  FONT_OPTIONS,
  FONT_SIZE_RANGE,
  LINE_HEIGHT_RANGE,
  PAGE_MARGIN_RANGE,
  type SliderRange,
} from '@/types/cv-builder-constants';
import { cn } from '@/lib/cn';

/**
 * Props for {@link DesignSidebar}.
 *
 * The sidebar is a controlled component: it owns no design state of its own.
 * Every interaction is forwarded to the parent through {@link DesignSidebarProps.onChangeTemplate}
 * or {@link DesignSidebarProps.onChangeTokens}. The parent stores the new
 * value into `cvData.templateId` / `cvData.designTokens`, which then flows
 * back in via props on the next render.
 */
export interface DesignSidebarProps {
  /** Currently selected template id (string for forward-compatibility). */
  templateId: string;
  /** Currently active design tokens. */
  tokens: CvDesignTokens;
  /**
   * Called when the user clicks a template button. The argument is one of the
   * three known template ids declared in {@link TemplateId}.
   */
  onChangeTemplate: (id: TemplateId) => void;
  /**
   * Called whenever any token changes. The full new {@link CvDesignTokens}
   * object is passed (never a partial patch) so the parent can replace state
   * in a single immutable update.
   */
  onChangeTokens: (tokens: CvDesignTokens) => void;
}

/**
 * Numeric clamp helper. Snaps `value` into `[range.min, range.max]`.
 *
 * Used to guard against out-of-bounds slider values before propagating them
 * upstream (Requirement 4.9). Native HTML range inputs already enforce the
 * bounds, but a malformed `value` attribute or a programmatic change could
 * still produce out-of-range numbers, so we re-clamp defensively.
 *
 * `NaN` falls back to `range.min` so the parent state never becomes invalid.
 */
function clamp(value: number, range: SliderRange): number {
  if (Number.isNaN(value)) return range.min;
  if (value < range.min) return range.min;
  if (value > range.max) return range.max;
  return value;
}

/**
 * Right-hand workspace panel that lets the user customise the visual design
 * of their CV in real time.
 *
 * The sidebar exposes four controls — template picker, font dropdown, accent
 * color grid (with a custom picker), and three sliders for `fontSize`,
 * `lineHeight`, and `pageMargin`. Bounds for the sliders come from the shared
 * constants in `cv-builder-constants.ts`, which mirror the backend
 * `CvDesignTokensDto` validators (Requirements 4.5, 4.6, 4.7).
 *
 * All values pass through {@link clamp} before being emitted so
 * {@link DesignSidebarProps.onChangeTokens} is never called with an
 * out-of-range value (Requirement 4.9).
 */
export function DesignSidebar({
  templateId,
  tokens,
  onChangeTemplate,
  onChangeTokens,
}: DesignSidebarProps) {
  // Stable ids so each <label> can target its <input> for accessibility.
  const fontFamilyId = useId();
  const fontSizeId = useId();
  const lineHeightId = useId();
  const pageMarginId = useId();
  const customColorId = useId();

  // Track the latest custom color the user picked (independent from the
  // preset grid) so the picker reflects their choice even when they swap to
  // a preset and back. Initialised from the current token so the first open
  // shows the active color.
  const [customColor, setCustomColor] = useState<string>(tokens.primaryColor);

  /**
   * Replace a single field of `tokens` and emit the resulting object.
   *
   * Numeric fields are clamped to the matching slider range before emission
   * so the parent never sees an out-of-range value (Requirement 4.9).
   */
  const updateToken = <K extends keyof CvDesignTokens>(
    key: K,
    value: CvDesignTokens[K],
  ) => {
    onChangeTokens({ ...tokens, [key]: value });
  };

  const handleFontFamilyChange = (event: ChangeEvent<HTMLSelectElement>) => {
    updateToken('fontFamily', event.target.value);
  };

  const handleFontSizeChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = clamp(Number.parseInt(event.target.value, 10), FONT_SIZE_RANGE);
    updateToken('fontSize', next);
  };

  const handleLineHeightChange = (event: ChangeEvent<HTMLInputElement>) => {
    // `parseFloat` because line-height has decimal step 0.1.
    const raw = Number.parseFloat(event.target.value);
    // Round to 1 decimal place to avoid float-precision noise like 1.6000001.
    const rounded = Math.round(raw * 10) / 10;
    updateToken('lineHeight', clamp(rounded, LINE_HEIGHT_RANGE));
  };

  const handlePageMarginChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = clamp(Number.parseInt(event.target.value, 10), PAGE_MARGIN_RANGE);
    updateToken('pageMargin', next);
  };

  const handleColorPresetClick = (color: string) => {
    updateToken('primaryColor', color);
  };

  const handleCustomColorChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value;
    setCustomColor(next);
    updateToken('primaryColor', next);
  };

  return (
    <aside
      // 300px panel matching the workspace layout in the design (Phase 5).
      className="flex h-full w-[300px] flex-col gap-8 overflow-y-auto border-l border-zinc-200 bg-white p-5 shadow-sm"
      aria-label="Tùy biến thiết kế CV"
      data-testid="design-sidebar"
    >
      {/* ──────────────── Template picker (Requirement 4.1, 4.2) ──────────────── */}
      <section className="space-y-3" aria-labelledby={`${fontFamilyId}-templates`}>
        <SectionHeading id={`${fontFamilyId}-templates`} icon={<LayoutGrid className="h-4 w-4" />}>
          Mẫu thiết kế
        </SectionHeading>
        <div className="grid grid-cols-1 gap-2">
          {TEMPLATES.map((template) => {
            const isActive = templateId === template.id;
            return (
              <button
                key={template.id}
                type="button"
                onClick={() => onChangeTemplate(template.id)}
                aria-pressed={isActive}
                title={template.description}
                className={cn(
                  'rounded-lg border-2 p-3 text-left text-sm font-semibold capitalize transition-all',
                  'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1',
                  isActive
                    ? 'border-indigo-600 bg-indigo-50/60 text-indigo-700'
                    : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300',
                )}
                data-testid={`design-sidebar-template-${template.id}`}
              >
                <span className="flex items-center justify-between">
                  <span>{template.name}</span>
                  {isActive ? <span aria-hidden className="text-xs">✓</span> : null}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ──────────────── Font family (Requirement 4.3, 4.8) ──────────────── */}
      <section className="space-y-3">
        <SectionHeading icon={<Type className="h-4 w-4" />}>Phông chữ</SectionHeading>
        <label htmlFor={fontFamilyId} className="sr-only">
          Phông chữ
        </label>
        <select
          id={fontFamilyId}
          value={tokens.fontFamily}
          onChange={handleFontFamilyChange}
          className="w-full rounded-lg border border-zinc-300 bg-white p-2 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          // The native `select` font is not used for the closed value on most
          // browsers, but each <option>'s inline `style` ensures the option
          // labels in the dropdown render in their own font (Requirement 4.3).
          style={{ fontFamily: tokens.fontFamily }}
          data-testid="design-sidebar-font-family"
        >
          {FONT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value} style={{ fontFamily: option.value }}>
              {option.label}
            </option>
          ))}
        </select>
      </section>

      {/* ──────────────── Color presets + custom (Requirement 4.4, 4.8) ──────────────── */}
      <section className="space-y-3">
        <SectionHeading icon={<Palette className="h-4 w-4" />}>Màu nhấn</SectionHeading>
        <div
          className="grid grid-cols-5 gap-2"
          role="radiogroup"
          aria-label="Bảng màu chủ đề"
          data-testid="design-sidebar-color-grid"
        >
          {COLOR_PRESETS.map((color) => {
            const isActive = tokens.primaryColor.toLowerCase() === color.toLowerCase();
            return (
              <button
                key={color}
                type="button"
                role="radio"
                aria-checked={isActive}
                aria-label={`Chọn màu ${color}`}
                onClick={() => handleColorPresetClick(color)}
                className={cn(
                  'relative flex h-9 w-9 items-center justify-center rounded-full border-2 transition-transform',
                  'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1',
                  isActive
                    ? 'scale-110 border-indigo-600'
                    : 'border-transparent hover:scale-105',
                )}
                style={{ backgroundColor: color }}
                data-testid={`design-sidebar-color-${color}`}
              >
                {isActive ? (
                  <span aria-hidden className="text-xs font-bold text-white drop-shadow">
                    ✓
                  </span>
                ) : null}
              </button>
            );
          })}
          {/*
            Custom color picker — the actual <input type="color"> is hidden
            (opacity 0) on top of a paintbrush icon. Clicking the icon opens
            the OS color dialog (Requirement 4.4).
          */}
          <label
            htmlFor={customColorId}
            className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-zinc-300 bg-zinc-50 transition-colors hover:bg-zinc-100"
            title="Chọn màu tùy chỉnh"
            data-testid="design-sidebar-color-custom"
          >
            <Paintbrush className="h-4 w-4 text-zinc-500" aria-hidden />
            <span className="sr-only">Chọn màu tùy chỉnh</span>
            <input
              id={customColorId}
              type="color"
              value={customColor}
              onChange={handleCustomColorChange}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              aria-label="Chọn màu tùy chỉnh"
            />
          </label>
        </div>
      </section>

      {/* ──────────────── Sliders (Requirements 4.5, 4.6, 4.7, 4.9) ──────────────── */}
      <section className="space-y-5">
        <SectionHeading icon={<Sliders className="h-4 w-4" />}>
          Kích thước &amp; khoảng cách
        </SectionHeading>

        <SliderField
          id={fontSizeId}
          label="Cỡ chữ cơ sở"
          // Whole-pixel value, render with px suffix.
          valueLabel={`${tokens.fontSize}px`}
          range={FONT_SIZE_RANGE}
          value={tokens.fontSize}
          onChange={handleFontSizeChange}
          testId="design-sidebar-font-size"
        />

        <SliderField
          id={lineHeightId}
          label="Khoảng cách dòng"
          // Always show one decimal place so 1.5 doesn't render as "1.5" vs "1".
          valueLabel={tokens.lineHeight.toFixed(1)}
          range={LINE_HEIGHT_RANGE}
          value={tokens.lineHeight}
          onChange={handleLineHeightChange}
          testId="design-sidebar-line-height"
        />

        <SliderField
          id={pageMarginId}
          label="Lề trang A4"
          valueLabel={`${tokens.pageMargin}px`}
          range={PAGE_MARGIN_RANGE}
          value={tokens.pageMargin}
          onChange={handlePageMarginChange}
          testId="design-sidebar-page-margin"
        />
      </section>
    </aside>
  );
}

/**
 * Section heading with an icon, used to label each control group inside the
 * sidebar. The `id` prop is optional and only set when an element needs to be
 * referenced via `aria-labelledby`.
 */
function SectionHeading({
  id,
  icon,
  children,
}: {
  id?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <h3
      id={id}
      className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500"
    >
      <span className="text-indigo-500" aria-hidden>
        {icon}
      </span>
      {children}
    </h3>
  );
}

/**
 * Single slider row with a header (label on the left, current value on the
 * right) and a styled `<input type="range">`. Extracted so the three sliders
 * remain visually consistent without repetition.
 */
function SliderField({
  id,
  label,
  valueLabel,
  range,
  value,
  onChange,
  testId,
}: {
  id: string;
  label: string;
  valueLabel: string;
  range: SliderRange;
  value: number;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  testId?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-medium text-zinc-600">
        <label htmlFor={id}>{label}</label>
        <span className="font-bold text-indigo-600" data-testid={testId ? `${testId}-value` : undefined}>
          {valueLabel}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={range.min}
        max={range.max}
        step={range.step}
        value={value}
        onChange={onChange}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-zinc-200 accent-indigo-600"
        data-testid={testId}
      />
    </div>
  );
}
