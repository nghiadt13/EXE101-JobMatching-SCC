import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';

// `vi.mock` is hoisted above the imports so the auto-save hook receives the
// mocked REST client rather than dispatching a real `fetch` against the
// NestJS API. The factory is intentionally lean — individual tests configure
// resolution behaviour as needed.
vi.mock('@/lib/cv/update-builder-cv', () => ({
  updateBuilderCv: vi.fn().mockResolvedValue({ ok: true }),
}));

import { InlineEditableText } from '../inline-editable-text';
import { useAutoSave } from '@/hooks/use-auto-save';
import { updateBuilderCv } from '@/lib/cv/update-builder-cv';
import type { CvBuilderData } from '@/types/cv-builder';
import { AUTO_SAVE_DEBOUNCE_MS } from '@/types/cv-builder-constants';

const mockedUpdate = vi.mocked(updateBuilderCv);

/**
 * Minimal valid `CvBuilderData` shape used as the seed state for the test
 * harness. Only the `profile.name` field is exercised by these tests so the
 * other arrays stay empty to keep the assertions focused on the
 * inline-edit → debounced-save invariant.
 */
const baseData: CvBuilderData = {
  templateId: 'simple',
  profile: { name: '' },
  experience: [],
  education: [],
  skills: [],
  projects: [],
  certifications: [],
  languages: [],
};

/**
 * Test harness that wires the real `InlineEditableText` component to the real
 * `useAutoSave` hook through a small parent that owns `cvData` state — the
 * same wiring used by `CvBuilderPage` in production.
 *
 * Every blur of the inline editor produces exactly one `onChange` invocation
 * which:
 *   1. updates the parent state immutably,
 *   2. forwards the new payload into `autoSave.debouncedSave`.
 */
function Harness() {
  const [data, setData] = useState<CvBuilderData>(baseData);
  const autoSave = useAutoSave('cv-1', 'token-1');

  return (
    <div>
      <InlineEditableText
        value={data.profile.name}
        onChange={(name) => {
          const next: CvBuilderData = {
            ...data,
            profile: { ...data.profile, name },
          };
          setData(next);
          autoSave.debouncedSave(next);
        }}
        ariaLabel="name"
      />
      <button type="button">outside</button>
    </div>
  );
}

beforeEach(() => {
  // Fake timers let the test fast-forward the 1500 ms debounce window
  // deterministically instead of waiting in real time. `shouldAdvanceTime`
  // keeps internal timers (e.g. user-event's pointer delays) progressing
  // automatically so `keyboard()` / `tab()` do not hang under fake time.
  vi.useFakeTimers({ shouldAdvanceTime: true });
  mockedUpdate.mockReset();
  mockedUpdate.mockResolvedValue({ ok: true });
});

afterEach(() => {
  vi.useRealTimers();
});

// ===========================================================================
// Task 10.5 — Integration test for the inline edit → debounced save flow
// ===========================================================================

describe('Inline edit → debounced save flow', () => {
  /**
   * **Validates: Requirements 1.2, 1.3, 6.3, 6.7**
   *
   * End-to-end wiring check that exercises the contract between
   * `InlineEditableText` (Req 1.2 — no parent updates while typing,
   * Req 1.3 — single `onChange` fired on blur) and `useAutoSave` (Req 6.3 —
   * 1.5 s debounce window, Req 6.7 — N rapid edits coalesce into one
   * `updateBuilderCv` request).
   *
   * Sequence asserted:
   *   - User types "Jane Doe" → no `onChange`, no network call.
   *   - User blurs (Tab) → exactly one `onChange` fires the debounced save.
   *   - Before the 1.5 s window elapses → still no network call.
   *   - After the window elapses → exactly one `updateBuilderCv` call with
   *     the final payload reaches the API.
   */
  it('typing then blurring fires updateBuilderCv exactly once after the debounce window', async () => {
    // `advanceTimers` is required when fake timers are active so user-event's
    // internal sleep helpers progress deterministically alongside the test.
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime.bind(vi),
    });

    render(<Harness />);

    const input = screen.getByLabelText('name') as HTMLInputElement;

    await user.click(input);
    await user.keyboard('Jane Doe');

    // Req 1.2 — no parent update while typing → debouncedSave has not been
    // called yet, so the API mock has not been touched either.
    expect(mockedUpdate).not.toHaveBeenCalled();

    // Blur by tabbing away. This triggers the single `onChange` (Req 1.3),
    // which schedules the debounced save (Req 6.3).
    await user.tab();

    // The debounce window has not elapsed yet, so no fetch should have fired.
    expect(mockedUpdate).not.toHaveBeenCalled();

    // Advance past the full debounce window so the timer fires and the
    // pending payload is flushed exactly once (Req 6.3, 6.7).
    await act(async () => {
      await vi.advanceTimersByTimeAsync(AUTO_SAVE_DEBOUNCE_MS + 100);
    });

    expect(mockedUpdate).toHaveBeenCalledTimes(1);
    expect(mockedUpdate).toHaveBeenCalledWith(
      'cv-1',
      'token-1',
      expect.objectContaining({
        profile: expect.objectContaining({ name: 'Jane Doe' }),
      }),
    );
  });
});
