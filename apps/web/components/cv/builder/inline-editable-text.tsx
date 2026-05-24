'use client';

import {
  type ChangeEvent,
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import { cn } from '@/lib/cn';

/**
 * Props for {@link InlineEditableText}.
 */
export interface InlineEditableTextProps {
  /** Current value provided by the parent. */
  value: string;
  /**
   * Called once with the latest internal value when the field loses focus
   * (Requirement 1.3). Not called on every keystroke.
   */
  onChange: (val: string) => void;
  /**
   * Placeholder shown when the field is empty so the user knows what to fill
   * in (Requirements 1.8, 14.1, 14.3).
   */
  placeholder?: string;
  /**
   * Render as a single-line `<input>` or auto-growing `<textarea>`.
   * Defaults to `'input'`.
   */
  type?: 'input' | 'textarea';
  /** Additional Tailwind classes merged with the base styling. */
  className?: string;
  /** Accessible label exposed to assistive tech. */
  ariaLabel?: string;
}

/**
 * Style overrides that force the editor to inherit typography from its parent
 * so it visually matches the surrounding template (Requirement 1.6).
 */
const INHERIT_STYLE: CSSProperties = {
  font: 'inherit',
  color: 'inherit',
  lineHeight: 'inherit',
  letterSpacing: 'inherit',
  textAlign: 'inherit',
};

/**
 * Base classes applied to both the `<input>` and `<textarea>` variants.
 *
 * - Borderless when blurred, dotted blue border when focused (Requirement 1.7).
 *   A 1px transparent border is reserved at all times so focusing does not
 *   shift surrounding layout.
 * - Transparent background, no padding/margin, and full width so the editor
 *   blends seamlessly with the template.
 * - `min-h-[1.2em]` keeps the field at one line height even when empty,
 *   preventing the layout from collapsing (Requirements 1.8, 14.2).
 */
const BASE_CLASS = cn(
  'block w-full bg-transparent p-0 m-0',
  'border border-transparent rounded-sm outline-none',
  'placeholder:italic placeholder:text-slate-400',
  'focus:border-dotted focus:border-blue-500',
  'min-h-[1.2em] resize-none',
);

/**
 * Borderless inline editor used inside the A4 canvas of CV Builder 2.0.
 *
 * The component renders a real `<input>` or `<textarea>` element instead of
 * relying on `contenteditable` so user input is always treated as plain text
 * and never as HTML (Requirement 11.1).
 *
 * Behaviour summary:
 *
 * - Maintains an internal `localValue` and only calls `onChange` on blur to
 *   minimise parent re-renders during typing (Requirements 1.1, 1.2, 1.3).
 * - On `<input>` type, pressing `Enter` blurs the field instead of inserting
 *   a newline so single-line fields cannot grow into multi-line input
 *   (Requirement 1.4).
 * - On `<textarea>` type, the height is synced to `scrollHeight` after each
 *   keystroke so the field auto-grows to fit multi-line content
 *   (Requirement 1.5).
 * - Inherits `font`, `color`, `line-height`, `letter-spacing`, and
 *   `text-align` from the parent so the editor matches the template visually
 *   (Requirement 1.6).
 * - Native `placeholder` attribute is used so the placeholder disappears the
 *   moment the user types and reappears when the field is empty, while the
 *   `min-h-[1.2em]` rule preserves the field's vertical footprint
 *   (Requirements 1.8, 14.1, 14.2, 14.3).
 */
export function InlineEditableText({
  value,
  onChange,
  placeholder,
  type = 'input',
  className,
  ariaLabel,
}: InlineEditableTextProps) {
  const [localValue, setLocalValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Sync external updates to `value` into local state, but only while the
  // field is not being edited. This keeps an in-flight edit from being
  // clobbered by a debounced parent update (Requirement 1.2).
  useEffect(() => {
    if (!isFocused) {
      setLocalValue(value);
    }
  }, [value, isFocused]);

  // Auto-grow the textarea by matching its height to `scrollHeight` after
  // each value change (Requirement 1.5). Reset to `auto` first so the
  // measurement shrinks when content is removed.
  useLayoutEffect(() => {
    if (type !== 'textarea') return;
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [localValue, type]);

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setLocalValue(event.target.value);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = (
    _event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setIsFocused(false);
    // Commit the latest local value to the parent exactly once (Requirement 1.3).
    onChange(localValue);
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      // Single-line fields must not accept newlines; commit via blur instead
      // (Requirement 1.4).
      event.preventDefault();
      event.currentTarget.blur();
    }
  };

  if (type === 'textarea') {
    return (
      <textarea
        ref={textareaRef}
        value={localValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        aria-label={ariaLabel}
        rows={1}
        style={INHERIT_STYLE}
        className={cn(BASE_CLASS, 'overflow-hidden', className)}
      />
    );
  }

  return (
    <input
      type="text"
      value={localValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleInputKeyDown}
      placeholder={placeholder}
      aria-label={ariaLabel}
      style={INHERIT_STYLE}
      className={cn(BASE_CLASS, className)}
    />
  );
}
