'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { updateBuilderCv } from '@/lib/cv/update-builder-cv';
import type { CvBuilderData } from '@/types/cv-builder';
import { AUTO_SAVE_DEBOUNCE_MS } from '@/types/cv-builder-constants';

/**
 * Auto-save lifecycle states surfaced by {@link useAutoSave}.
 *
 *   - `saved`   — last persisted payload matches client state (no pending changes).
 *   - `dirty`   — a change is waiting on the debounce timer to flush.
 *   - `saving`  — a `PUT /cvs/:id/builder` request is currently in flight.
 *   - `error`   — the most recent network attempt failed; `retry` is available.
 */
export type SaveStatus = 'saved' | 'saving' | 'error' | 'dirty';

export interface UseAutoSaveReturn {
  /** Current auto-save lifecycle state. */
  saveStatus: SaveStatus;
  /**
   * Schedule a debounced save. Successive calls within
   * {@link AUTO_SAVE_DEBOUNCE_MS} of each other coalesce into a single network
   * request whose payload is the most recent argument.
   */
  debouncedSave: (data: CvBuilderData) => void;
  /** Re-attempt the most recent failed (or pending) save immediately. */
  retry: () => void;
  /** Synchronously mark dirty without triggering a save (parent calls this on edits). */
  markDirty: () => void;
}

/**
 * Auto-save hook for the CV Builder workspace.
 *
 * The hook owns:
 *   - Save lifecycle state (`saved` / `dirty` / `saving` / `error`).
 *   - A hand-rolled debounce (`setTimeout` + `clearTimeout`) that stores the
 *     latest payload in a ref so rapid keystrokes coalesce into one request
 *     whose body is the most recent payload (Req 6.7).
 *   - Cleanup of any pending timer on unmount (Req 6.10).
 *   - A `beforeunload` listener that prompts the browser's confirmation dialog
 *     while there are unsaved changes (Req 6.11).
 *
 * The debounce is hand-rolled — using `setTimeout` / `clearTimeout` directly —
 * to keep the bundle small and to give the unmount and `retry` paths direct
 * access to the timer handle. No `lodash/debounce` dependency is needed.
 *
 * The hook calls {@link updateBuilderCv} which performs a direct
 * `PUT /cvs/:id/builder` via `fetch` (NOT a Server Action with
 * `revalidatePath`) so auto-save stays cheap (Req 6.8).
 *
 * Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.10, 6.11.
 */
export function useAutoSave(cvId: string, token: string): UseAutoSaveReturn {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');

  // Hand-rolled debounce primitives. The pending payload ref always holds the
  // *latest* CvBuilderData to send when the timer fires; previous payloads are
  // overwritten which is what coalesces rapid edits into one request (Req 6.7).
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingPayloadRef = useRef<CvBuilderData | null>(null);

  // Tracks the payload from the most recent failed save so `retry` knows what
  // to re-send even after `pendingPayloadRef` has been cleared.
  const lastFailedPayloadRef = useRef<CvBuilderData | null>(null);

  // Guards async `setState` calls after unmount.
  const isMountedRef = useRef<boolean>(true);

  // Mirror cvId/token in refs so callbacks below stay referentially stable
  // across renders (otherwise consumers' `useCallback` dependencies churn on
  // every parent re-render, defeating memoization).
  const cvIdRef = useRef(cvId);
  const tokenRef = useRef(token);
  useEffect(() => {
    cvIdRef.current = cvId;
  }, [cvId]);
  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  const performSave = useCallback(async (payload: CvBuilderData) => {
    setSaveStatus('saving');
    try {
      await updateBuilderCv(cvIdRef.current, tokenRef.current, payload);
      if (!isMountedRef.current) return;
      // If a newer payload was queued while this request was in flight, the
      // debounce timer for it is already running — keep the visible status as
      // `dirty` until that next save completes. Otherwise we are fully synced.
      if (pendingPayloadRef.current !== null) {
        setSaveStatus('dirty');
      } else {
        lastFailedPayloadRef.current = null;
        setSaveStatus('saved');
      }
    } catch {
      if (!isMountedRef.current) return;
      lastFailedPayloadRef.current = payload;
      setSaveStatus('error');
    }
  }, []);

  const flush = useCallback(() => {
    timerRef.current = null;
    const payload = pendingPayloadRef.current;
    pendingPayloadRef.current = null;
    if (payload === null) return;
    void performSave(payload);
  }, [performSave]);

  const markDirty = useCallback(() => {
    setSaveStatus('dirty');
  }, []);

  const debouncedSave = useCallback(
    (data: CvBuilderData) => {
      // Coalesce: replace any queued payload with the latest one so the next
      // network request carries only the most recent state (Req 6.7).
      pendingPayloadRef.current = data;
      // Surface the dirty state synchronously so the top bar indicator updates
      // on the same tick the user typed (Req 6.2).
      setSaveStatus('dirty');
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(flush, AUTO_SAVE_DEBOUNCE_MS);
    },
    [flush],
  );

  const retry = useCallback(() => {
    const payload = lastFailedPayloadRef.current ?? pendingPayloadRef.current;
    if (payload === null) return;
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    pendingPayloadRef.current = null;
    void performSave(payload);
  }, [performSave]);

  // Cancel pending timer on unmount to avoid `setState` on an unmounted
  // component (Req 6.10).
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  // Browser-level "are you sure you want to leave?" prompt while unsaved
  // changes exist (Req 6.11). The listener is only attached when needed so it
  // does not interfere with normal navigation in the steady state.
  useEffect(() => {
    if (saveStatus === 'saved') return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [saveStatus]);

  return { saveStatus, debouncedSave, retry, markDirty };
}
