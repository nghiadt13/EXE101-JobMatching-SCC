'use client';

import { useState, type MouseEvent, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * Props for {@link BlockOverlay}.
 *
 * The overlay is intended to wrap a single repeating entry inside a CV section
 * (e.g. an experience entry, education entry, or project entry). On hover it
 * reveals a floating toolbar with three actions:
 *
 * - **↑ Move up** — invokes {@link BlockOverlayProps.onMoveUp}. Disabled when
 *   {@link BlockOverlayProps.canMoveUp} is `false` (item is at index 0).
 * - **↓ Move down** — invokes {@link BlockOverlayProps.onMoveDown}. Disabled
 *   when {@link BlockOverlayProps.canMoveDown} is `false` (item is the last).
 * - **✕ Delete** — invokes {@link BlockOverlayProps.onDelete}. When
 *   {@link BlockOverlayProps.confirmDelete} is `true` (default), a browser
 *   confirm dialog is shown before invocation.
 *
 * All toolbar button click handlers call `event.stopPropagation()` so that the
 * click does not bubble to inline-editable text inside `children`.
 */
export interface BlockOverlayProps {
  /** Content to render inside the overlay (typically a CV entry). */
  children: ReactNode;
  /** Handler for the up arrow. Omit to hide the button. */
  onMoveUp?: () => void;
  /** Handler for the down arrow. Omit to hide the button. */
  onMoveDown?: () => void;
  /** Handler for the delete (✕) button. Omit to hide the button. */
  onDelete?: () => void;
  /**
   * When `false`, the up arrow is rendered disabled and cannot be clicked.
   * Defaults to `true`.
   */
  canMoveUp?: boolean;
  /**
   * When `false`, the down arrow is rendered disabled and cannot be clicked.
   * Defaults to `true`.
   */
  canMoveDown?: boolean;
  /**
   * When `true`, a browser confirm dialog is shown before invoking
   * {@link BlockOverlayProps.onDelete}. Defaults to `true`.
   */
  confirmDelete?: boolean;
  /** Optional accessible label used for the surrounding group (debug/aria). */
  ariaLabel?: string;
  /** Extra class names applied to the outer wrapper. */
  className?: string;
}

/**
 * Hover-detected wrapper that exposes a floating toolbar (move up, move down,
 * delete) for repeating CV entries.
 *
 * The dashed border and toolbar fade in via Tailwind `group-hover:` utilities,
 * so no `useState` is needed for hover detection — the browser handles it via
 * CSS for smooth 60 FPS transitions.
 */
export function BlockOverlay({
  children,
  onMoveUp,
  onMoveDown,
  onDelete,
  canMoveUp = true,
  canMoveDown = true,
  confirmDelete = true,
  ariaLabel,
  className,
}: BlockOverlayProps) {
  // Track delete-in-flight state so users do not see a stale confirm if they
  // double-click. This is purely a UX guard; correctness still relies on the
  // parent's immutable update.
  const [isDeleting, setIsDeleting] = useState(false);

  const handleMoveUp = (event: MouseEvent<HTMLButtonElement>) => {
    // Requirement 2.8: stop propagation so the click does not enter inline edit.
    event.stopPropagation();
    if (!canMoveUp || !onMoveUp) return;
    onMoveUp();
  };

  const handleMoveDown = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (!canMoveDown || !onMoveDown) return;
    onMoveDown();
  };

  const handleDelete = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (!onDelete || isDeleting) return;
    if (confirmDelete) {
      // Requirement 2.6: ask for confirmation before destructive action.
      const ok =
        typeof window !== 'undefined'
          ? window.confirm('Xóa mục này khỏi CV của bạn?')
          : true;
      if (!ok) return;
    }
    setIsDeleting(true);
    try {
      onDelete();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      // `group` enables `group-hover:` styling on descendants without JS.
      // `relative` anchors the absolutely-positioned toolbar.
      className={cn(
        'group relative rounded-md border border-transparent transition-colors',
        // Dashed border becomes visible on hover (Requirement 2.1).
        'hover:border-dashed hover:border-zinc-300',
        className,
      )}
      aria-label={ariaLabel}
      data-testid="block-overlay"
    >
      {/*
        Floating toolbar.
        - opacity-0 by default, opacity-100 on group-hover (Requirements 2.1, 2.2).
        - pointer-events-none when hidden so it cannot intercept clicks while invisible.
        - Positioned top-right, slightly outside the block.
      */}
      <div
        className={cn(
          'absolute right-1 top-1 z-10 flex items-center gap-1 rounded-md bg-white/95 px-1 py-0.5 shadow-sm ring-1 ring-zinc-200 backdrop-blur',
          'opacity-0 transition-opacity duration-150 group-hover:opacity-100',
          'pointer-events-none group-hover:pointer-events-auto',
        )}
        // The toolbar itself is not interactive content for screen readers
        // until revealed; aria-hidden flips with hover via CSS-only approach
        // is awkward, so leave default and rely on disabled buttons.
        role="toolbar"
        aria-label="Tùy chọn khối"
      >
        {onMoveUp ? (
          <button
            type="button"
            onClick={handleMoveUp}
            disabled={!canMoveUp}
            // Requirement 2.5: disabled state at boundary.
            className={cn(
              'flex h-6 w-6 items-center justify-center rounded text-xs font-semibold text-zinc-600',
              'hover:bg-zinc-100 hover:text-zinc-900',
              'disabled:cursor-not-allowed disabled:text-zinc-300 disabled:hover:bg-transparent',
            )}
            aria-label="Di chuyển lên"
            title="Di chuyển lên"
            data-testid="block-overlay-move-up"
          >
            ↑
          </button>
        ) : null}
        {onMoveDown ? (
          <button
            type="button"
            onClick={handleMoveDown}
            disabled={!canMoveDown}
            className={cn(
              'flex h-6 w-6 items-center justify-center rounded text-xs font-semibold text-zinc-600',
              'hover:bg-zinc-100 hover:text-zinc-900',
              'disabled:cursor-not-allowed disabled:text-zinc-300 disabled:hover:bg-transparent',
            )}
            aria-label="Di chuyển xuống"
            title="Di chuyển xuống"
            data-testid="block-overlay-move-down"
          >
            ↓
          </button>
        ) : null}
        {onDelete ? (
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className={cn(
              'flex h-6 w-6 items-center justify-center rounded text-xs font-semibold text-zinc-600',
              'hover:bg-red-50 hover:text-red-600',
              'disabled:cursor-not-allowed disabled:opacity-50',
            )}
            aria-label="Xóa"
            title="Xóa"
            data-testid="block-overlay-delete"
          >
            ✕
          </button>
        ) : null}
      </div>
      {children}
    </div>
  );
}
