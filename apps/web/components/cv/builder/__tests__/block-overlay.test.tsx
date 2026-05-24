import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { BlockOverlay } from '../block-overlay';

/**
 * Unit tests for {@link BlockOverlay}.
 *
 * Validates the contract described in the design doc (Component 4) and the
 * acceptance criteria for Requirement 2 of `cv-builder-2-0`.
 *
 * Notes on jsdom:
 * - The hover reveal is driven by Tailwind `group-hover:` utilities (CSS only),
 *   so we cannot assert the actual computed `opacity` value in jsdom. Instead we
 *   assert that the toolbar buttons are mounted in the DOM and carry the
 *   `group-hover:opacity-100` class — that is the public visual contract the
 *   component owns.
 * - We pass `pointerEventsCheck: 0` to `userEvent.setup()` so that
 *   `pointer-events: none` on the hidden toolbar (a CSS-only artifact) does not
 *   block synthetic clicks during interaction tests.
 */

afterEach(() => {
  vi.restoreAllMocks();
});

describe('BlockOverlay', () => {
  it('renders the floating toolbar with hover-driven opacity classes (Requirements 2.1, 2.2)', () => {
    render(
      <BlockOverlay
        onMoveUp={() => {}}
        onMoveDown={() => {}}
        onDelete={() => {}}
      >
        <div>child</div>
      </BlockOverlay>,
    );

    const toolbar = screen.getByRole('toolbar', { name: 'Tùy chọn khối' });
    expect(toolbar).toBeInTheDocument();
    // The toolbar is hidden by default (opacity-0) and revealed on group-hover.
    expect(toolbar).toHaveClass('opacity-0');
    expect(toolbar).toHaveClass('group-hover:opacity-100');
    // It must also be non-interactive while hidden so it does not eat clicks.
    expect(toolbar).toHaveClass('pointer-events-none');
    expect(toolbar).toHaveClass('group-hover:pointer-events-auto');

    // All three action buttons are rendered.
    expect(screen.getByLabelText('Di chuyển lên')).toBeInTheDocument();
    expect(screen.getByLabelText('Di chuyển xuống')).toBeInTheDocument();
    expect(screen.getByLabelText('Xóa')).toBeInTheDocument();
  });

  it('disables the up button when canMoveUp=false (Requirement 2.5)', () => {
    render(
      <BlockOverlay
        onMoveUp={() => {}}
        onMoveDown={() => {}}
        onDelete={() => {}}
        canMoveUp={false}
      >
        <div>child</div>
      </BlockOverlay>,
    );

    expect(screen.getByLabelText('Di chuyển lên')).toBeDisabled();
    expect(screen.getByLabelText('Di chuyển xuống')).not.toBeDisabled();
  });

  it('disables the down button when canMoveDown=false (Requirement 2.5)', () => {
    render(
      <BlockOverlay
        onMoveUp={() => {}}
        onMoveDown={() => {}}
        onDelete={() => {}}
        canMoveDown={false}
      >
        <div>child</div>
      </BlockOverlay>,
    );

    expect(screen.getByLabelText('Di chuyển xuống')).toBeDisabled();
    expect(screen.getByLabelText('Di chuyển lên')).not.toBeDisabled();
  });

  it('does not invoke a disabled handler when canMoveUp=false', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const onMoveUp = vi.fn();

    render(
      <BlockOverlay onMoveUp={onMoveUp} canMoveUp={false}>
        <div>child</div>
      </BlockOverlay>,
    );

    await user.click(screen.getByLabelText('Di chuyển lên'));
    expect(onMoveUp).not.toHaveBeenCalled();
  });

  it('stops click propagation so the parent onClick does not fire (Requirement 2.8)', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const parentClick = vi.fn();
    const onMoveUp = vi.fn();

    render(
      <div onClick={parentClick} data-testid="parent">
        <BlockOverlay onMoveUp={onMoveUp}>
          <div>child</div>
        </BlockOverlay>
      </div>,
    );

    await user.click(screen.getByLabelText('Di chuyển lên'));

    expect(onMoveUp).toHaveBeenCalledTimes(1);
    expect(parentClick).not.toHaveBeenCalled();
  });

  it('shows a confirm dialog and skips delete when the user cancels (Requirement 2.6)', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const onDelete = vi.fn();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(
      <BlockOverlay onDelete={onDelete}>
        <div>child</div>
      </BlockOverlay>,
    );

    await user.click(screen.getByLabelText('Xóa'));

    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('invokes onDelete only after the user confirms the dialog (Requirement 2.6)', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const onDelete = vi.fn();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(
      <BlockOverlay onDelete={onDelete}>
        <div>child</div>
      </BlockOverlay>,
    );

    await user.click(screen.getByLabelText('Xóa'));

    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('skips the confirm dialog when confirmDelete=false', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const onDelete = vi.fn();
    const confirmSpy = vi.spyOn(window, 'confirm');

    render(
      <BlockOverlay onDelete={onDelete} confirmDelete={false}>
        <div>child</div>
      </BlockOverlay>,
    );

    await user.click(screen.getByLabelText('Xóa'));

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
