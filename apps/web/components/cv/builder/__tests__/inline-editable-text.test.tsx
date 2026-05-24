import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { InlineEditableText } from '../inline-editable-text';

describe('InlineEditableText', () => {
  describe('blur saves (Requirements 1.2, 1.3)', () => {
    it('does not call onChange while typing and calls it exactly once on blur with the final value', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(
        <div>
          <InlineEditableText value="" onChange={onChange} ariaLabel="name" />
          <button type="button">outside</button>
        </div>,
      );

      const input = screen.getByLabelText('name') as HTMLInputElement;

      await user.click(input);
      await user.keyboard('Jane');

      // No parent updates while typing - keystrokes only update local state.
      expect(onChange).not.toHaveBeenCalled();

      // Blur by tabbing away.
      await user.tab();

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith('Jane');
    });
  });

  describe('Enter blurs single-line input (Requirement 1.4)', () => {
    it('pressing Enter on an input commits the value via blur and removes focus', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(
        <InlineEditableText value="" onChange={onChange} ariaLabel="title" />,
      );

      const input = screen.getByLabelText('title') as HTMLInputElement;

      await user.click(input);
      expect(document.activeElement).toBe(input);

      await user.keyboard('Frontend Developer{Enter}');

      // Enter should have triggered blur, which commits the value.
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith('Frontend Developer');
      expect(document.activeElement).not.toBe(input);
    });
  });

  describe('Textarea grows on multi-line content (Requirement 1.5)', () => {
    const SCROLL_HEIGHT = 80;
    let scrollHeightSpy: PropertyDescriptor | undefined;

    beforeEach(() => {
      // jsdom does not implement layout, so scrollHeight is always 0. Stub it
      // so the auto-grow effect has a meaningful value to write back.
      scrollHeightSpy = Object.getOwnPropertyDescriptor(
        HTMLElement.prototype,
        'scrollHeight',
      );
      Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
        configurable: true,
        get() {
          return SCROLL_HEIGHT;
        },
      });
    });

    afterEach(() => {
      if (scrollHeightSpy) {
        Object.defineProperty(
          HTMLElement.prototype,
          'scrollHeight',
          scrollHeightSpy,
        );
      } else {
        // Best-effort cleanup if the descriptor did not previously exist.
        delete (HTMLElement.prototype as unknown as Record<string, unknown>)
          .scrollHeight;
      }
    });

    it('sets the textarea height to scrollHeight when value contains newlines', () => {
      const onChange = vi.fn();

      render(
        <InlineEditableText
          type="textarea"
          value={'line one\nline two\nline three'}
          onChange={onChange}
          ariaLabel="summary"
        />,
      );

      const textarea = screen.getByLabelText('summary') as HTMLTextAreaElement;

      // The auto-grow layout effect resets height to 'auto' first then writes
      // scrollHeight back as a px value.
      expect(textarea.tagName).toBe('TEXTAREA');
      expect(textarea.style.height).toBe(`${SCROLL_HEIGHT}px`);
    });
  });

  describe('Placeholder visible when empty (Requirements 1.8, 14.1, 14.2)', () => {
    it('renders the native HTML placeholder attribute when value is empty', () => {
      const onChange = vi.fn();

      render(
        <InlineEditableText
          value=""
          onChange={onChange}
          placeholder="Tên của bạn"
          ariaLabel="name"
        />,
      );

      const input = screen.getByPlaceholderText(
        'Tên của bạn',
      ) as HTMLInputElement;

      // The placeholder attribute is rendered natively, and the input is empty.
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('placeholder', 'Tên của bạn');
      expect(input.value).toBe('');
    });
  });
});
