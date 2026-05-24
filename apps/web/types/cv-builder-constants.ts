// Shared constants for the CV Builder 2.0 WYSIWYG editor.
//
// Bounds in this file MUST stay in sync with the backend `CvDesignTokensDto`
// validators in `apps/api/src/cvs/dto/create-cv.dto.ts`.

/** A single entry in the font family dropdown. */
export interface FontOption {
  /** CSS font-family string (matches `CvDesignTokens.fontFamily`). */
  value: string;
  /** Human-readable label rendered in the dropdown using the font itself. */
  label: string;
}

/**
 * Five canonical font families exposed to the user. The ordering is preserved
 * in the UI so the first entry doubles as the default selection.
 */
export const FONT_OPTIONS: ReadonlyArray<FontOption> = [
  { value: 'Inter, sans-serif', label: 'Inter' },
  { value: 'Roboto, sans-serif', label: 'Roboto' },
  { value: 'Outfit, sans-serif', label: 'Outfit' },
  { value: '"Times New Roman", serif', label: 'Times New Roman' },
  { value: 'Arial, sans-serif', label: 'Arial' },
];

/**
 * Ten preset accent colors offered as a swatch grid in the Design Sidebar.
 * Stored as 6-digit hex strings so they can be safely concatenated with an
 * alpha channel (`#RRGGBBAA`) in the modern template.
 */
export const COLOR_PRESETS: ReadonlyArray<string> = [
  '#0f172a', // slate
  '#1e40af', // blue
  '#0e7490', // cyan
  '#047857', // emerald
  '#7c3aed', // violet
  '#be185d', // pink
  '#b91c1c', // red
  '#c2410c', // orange
  '#a16207', // amber
  '#374151', // gray
];

/** Numeric range descriptor for slider inputs. */
export interface SliderRange {
  min: number;
  max: number;
  step: number;
}

/** Base font size slider range, in pixels. */
export const FONT_SIZE_RANGE: SliderRange = { min: 10, max: 16, step: 1 };

/** Line height slider range, unitless multiplier. */
export const LINE_HEIGHT_RANGE: SliderRange = { min: 1.2, max: 2.0, step: 0.1 };

/** Page margin slider range, in pixels. */
export const PAGE_MARGIN_RANGE: SliderRange = { min: 20, max: 60, step: 5 };

/** A4 page width in pixels at 96 DPI (210mm). */
export const A4_PIXEL_WIDTH = 794;

/** A4 page height in pixels at 96 DPI (297mm). */
export const A4_PIXEL_HEIGHT = 1123;

/** Zoom slider range applied via `transform: scale(...)` on the canvas root. */
export const ZOOM_RANGE: SliderRange = { min: 0.6, max: 1.3, step: 0.05 };

/** Default zoom level when the editor first mounts. */
export const DEFAULT_ZOOM = 0.9;

/** Idle window (in ms) before auto-save fires after the last keystroke. */
export const AUTO_SAVE_DEBOUNCE_MS = 1500;
