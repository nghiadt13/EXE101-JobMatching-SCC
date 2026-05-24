import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import * as fc from 'fast-check';
import { renderHook, act } from '@testing-library/react';

// `vi.mock` is hoisted above the imports so the hook receives the mocked
// version of `updateBuilderCv` rather than the real `fetch`-driven client.
// The factory is intentionally lean — individual tests configure resolution
// or rejection behaviour per case.
vi.mock('@/lib/cv/update-builder-cv', () => ({
  updateBuilderCv: vi.fn().mockResolvedValue({ ok: true }),
}));

import { useAutoSave } from '../use-auto-save';
import { updateBuilderCv } from '@/lib/cv/update-builder-cv';
import type { CvBuilderData } from '@/types/cv-builder';
import { AUTO_SAVE_DEBOUNCE_MS } from '@/types/cv-builder-constants';

const mockedUpdate = vi.mocked(updateBuilderCv);

/**
 * Tests for the {@link useAutoSave} hook covering two concerns:
 *
 * 1. **Property 6: Auto-save Debounce Coalescing** (Task 8.4) — N rapid
 *    `debouncedSave(payload_i)` calls within `AUTO_SAVE_DEBOUNCE_MS` must
 *    collapse into exactly one network request with the latest payload.
 *
 * 2. **Save status transitions** (Task 8.5) — dirty → saving → saved on
 *    success, dirty → saving → error on failure, and `beforeunload` calling
 *    `preventDefault()` while the save lifecycle has unsaved changes.
 */

/**
 * Minimal valid `CvBuilderData` used as the "base" shape across the suite.
 * Property tests vary `profile.name` so each generated payload is unique
 * enough to assert "the LAST payload" reached the network.
 */
const baseData: CvBuilderData = {
  templateId: 'simple',
  profile: { name: 'Test' },
  experience: [],
  education: [],
  skills: [],
  projects: [],
  certifications: [],
  languages: [],
};

beforeEach(() => {
  // Fake timers let the test fast-forward the 1500 ms debounce window
  // deterministically instead of waiting in real time.
  vi.useFakeTimers();
  mockedUpdate.mockReset();
  // Default to a successful save so individual tests can override only the
  // failure cases explicitly.
  mockedUpdate.mockResolvedValue({ ok: true });
});

afterEach(() => {
  vi.useRealTimers();
});

// ===========================================================================
// Task 8.4 — Property 6: Auto-save Debounce Coalescing
// ===========================================================================

describe('useAutoSave (Property 6: debounce coalescing)', () => {
  /**
   * Generator constrained to the `CvBuilderData` shape, varying only the
   * profile name so each generated payload has a distinguishable identity.
   * Other array fields are kept empty to keep the property focused on the
   * coalescing invariant rather than data fuzzing.
   */
  const cvDataArb: fc.Arbitrary<CvBuilderData> = fc
    .record({
      profileName: fc.string({ maxLength: 20 }),
    })
    .map(({ profileName }) => ({
      ...baseData,
      profile: { name: profileName },
    }));

  /**
   * **Validates: Requirements 6.3, 6.7**
   *
   * For any sequence of 2..8 rapid `debouncedSave(payload_i)` calls fired
   * inside the same debounce window, the hook must:
   *   - issue exactly **one** call to `updateBuilderCv`,
   *   - pass through the **last** payload from the sequence.
   *
   * Additional intermediate payloads are dropped on the floor — that's the
   * whole point of the debounce coalescing the parent re-render storm into
   * a single network request.
   */
  it('Property 6: coalesces N rapid calls into a single fetch with the last payload', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(cvDataArb, { minLength: 2, maxLength: 8 }),
        async (payloads) => {
          // Reset the mock between runs so we count calls per iteration only.
          mockedUpdate.mockClear();
          mockedUpdate.mockResolvedValue({ ok: true });

          const { result, unmount } = renderHook(() =>
            useAutoSave('cv-1', 'token-1'),
          );

          // Fire all payloads back-to-back inside a single act so React
          // batches the resulting state updates the same way the real UI
          // would when the user types quickly.
          act(() => {
            for (const p of payloads) {
              result.current.debouncedSave(p);
            }
          });

          // Advance past the full debounce window so the timer fires and
          // flush() runs `updateBuilderCv` once with the latest payload.
          await act(async () => {
            await vi.advanceTimersByTimeAsync(AUTO_SAVE_DEBOUNCE_MS + 100);
          });

          expect(mockedUpdate).toHaveBeenCalledTimes(1);
          expect(mockedUpdate).toHaveBeenCalledWith(
            'cv-1',
            'token-1',
            payloads[payloads.length - 1],
          );

          unmount();
        },
      ),
      { numRuns: 10 },
    );
  });
});

// ===========================================================================
// Task 8.5 — Save status transitions
// ===========================================================================

describe('useAutoSave (status transitions)', () => {
  /**
   * **Validates: Requirements 6.2, 6.4, 6.5**
   *
   * The hook must walk through `dirty → saving → saved` on the happy path:
   * - `debouncedSave` flips the indicator to `dirty` synchronously so the
   *   top bar can react on the same render.
   * - When the timer fires, `saving` becomes visible while the request is
   *   in-flight.
   * - Once the response settles, the status transitions to `saved`.
   *
   * A controlled promise is used so the test can observe the `saving`
   * state explicitly between the two terminal states.
   */
  it('transitions dirty → saving → saved on successful save', async () => {
    // Build a manually-resolvable promise so the test can hold the request
    // in the `saving` state long enough to inspect it.
    let resolveUpdate: (value: { ok: true }) => void = () => {
      /* assigned synchronously below */
    };
    const controlledPromise = new Promise<{ ok: true }>((resolve) => {
      resolveUpdate = resolve;
    });
    mockedUpdate.mockReturnValueOnce(controlledPromise);

    const { result } = renderHook(() => useAutoSave('cv-1', 'token-1'));

    // Initial state — nothing has changed yet.
    expect(result.current.saveStatus).toBe('saved');

    // Synchronous transition: any keystroke flips us to `dirty` immediately.
    act(() => {
      result.current.debouncedSave(baseData);
    });
    expect(result.current.saveStatus).toBe('dirty');

    // Timer fires → flush() → performSave() sets `saving` synchronously and
    // then suspends on the controlled promise.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(AUTO_SAVE_DEBOUNCE_MS);
    });
    expect(result.current.saveStatus).toBe('saving');

    // Resolve the in-flight request and let React commit the success branch.
    await act(async () => {
      resolveUpdate({ ok: true });
      // Yield once so the awaiting `performSave` continuation can run.
      await Promise.resolve();
    });
    expect(result.current.saveStatus).toBe('saved');
  });

  /**
   * **Validates: Requirements 6.6**
   *
   * When `updateBuilderCv` throws (network error or 4xx/5xx response), the
   * hook must end the lifecycle in `error` so the UI can surface the
   * retry affordance.
   */
  it('transitions dirty → saving → error when save fails', async () => {
    mockedUpdate.mockRejectedValueOnce(new Error('[500] internal error'));

    const { result } = renderHook(() => useAutoSave('cv-1', 'token-1'));

    act(() => {
      result.current.debouncedSave(baseData);
    });
    expect(result.current.saveStatus).toBe('dirty');

    // Advance past the debounce, then flush microtasks so the rejected
    // promise's catch branch lands and `setSaveStatus('error')` commits.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(AUTO_SAVE_DEBOUNCE_MS + 100);
    });
    expect(result.current.saveStatus).toBe('error');
  });

  /**
   * **Validates: Requirements 6.10, 6.11**
   *
   * While `saveStatus !== 'saved'`, a `beforeunload` event must be cancelled
   * (`event.preventDefault()`) so the browser displays its native "are you
   * sure you want to leave?" dialog. The listener is only attached when
   * needed, so we verify it engages once `dirty` lands.
   */
  it('preventDefault on beforeunload while saveStatus is not saved', () => {
    const { result } = renderHook(() => useAutoSave('cv-1', 'token-1'));

    // Drive into the dirty state. The hook attaches the beforeunload
    // listener via a useEffect keyed on saveStatus, so it engages here.
    act(() => {
      result.current.debouncedSave(baseData);
    });
    expect(result.current.saveStatus).toBe('dirty');

    // Use a generic cancelable Event — jsdom doesn't ship a real
    // BeforeUnloadEvent constructor and the hook only depends on
    // preventDefault / returnValue which Event already supports.
    const ev = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(ev);

    expect(ev.defaultPrevented).toBe(true);
  });
});
