import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DesignSidebar } from '../design-sidebar';
import { DEFAULT_DESIGN_TOKENS, type TemplateId } from '@/types/cv-builder';

/**
 * Unit tests for {@link DesignSidebar}.
 *
 * Covers the four contracts from task 5.2 of `cv-builder-2-0`:
 *   1. Slider bounds clamping (Requirement 4.9)
 *   2. Font dropdown emits new tokens (Requirement 4.3, 4.8)
 *   3. Color preset click emits new tokens (Requirement 4.4, 4.8)
 *   4. Custom color input emits new tokens (Requirement 4.4, 4.8)
 *
 * The component is fully controlled, so each test asserts that user input
 * results in `onChangeTokens` being called with the expected token payload.
 * `fireEvent.change` is used for the range slider because `userEvent.type`
 * cannot drive a `<input type="range">` in jsdom — range inputs require a
 * direct value assignment.
 */

const baseProps = () => ({
  templateId: 'simple' as TemplateId,
  tokens: DEFAULT_DESIGN_TOKENS,
  onChangeTemplate: vi.fn(),
  onChangeTokens: vi.fn(),
});

describe('DesignSidebar', () => {
  describe('Slider bounds clamping (Requirement 4.9)', () => {
    it('clamps an out-of-range fontSize value (99 -> 16) before emitting', () => {
      const props = baseProps();
      render(<DesignSidebar {...props} />);

      const slider = screen.getByTestId(
        'design-sidebar-font-size',
      ) as HTMLInputElement;

      // jsdom does not enforce native HTML range bounds, so we can drive the
      // slider with a deliberately out-of-range value to exercise the
      // component's defensive clamp helper.
      fireEvent.change(slider, { target: { value: '99' } });

      expect(props.onChangeTokens).toHaveBeenCalledTimes(1);
      expect(props.onChangeTokens).toHaveBeenCalledWith({
        ...DEFAULT_DESIGN_TOKENS,
        fontSize: 16,
      });
    });

    it('clamps an under-range fontSize value (-5 -> 10) before emitting', () => {
      const props = baseProps();
      render(<DesignSidebar {...props} />);

      const slider = screen.getByTestId(
        'design-sidebar-font-size',
      ) as HTMLInputElement;

      fireEvent.change(slider, { target: { value: '-5' } });

      expect(props.onChangeTokens).toHaveBeenCalledTimes(1);
      expect(props.onChangeTokens).toHaveBeenCalledWith({
        ...DEFAULT_DESIGN_TOKENS,
        fontSize: 10,
      });
    });
  });

  describe('Font dropdown emits new tokens (Requirements 4.3, 4.8)', () => {
    it('selecting a different font family emits a new token object preserving other fields', async () => {
      const user = userEvent.setup();
      const props = baseProps();
      render(<DesignSidebar {...props} />);

      const select = screen.getByTestId(
        'design-sidebar-font-family',
      ) as HTMLSelectElement;

      await user.selectOptions(select, 'Roboto, sans-serif');

      expect(props.onChangeTokens).toHaveBeenCalledTimes(1);
      expect(props.onChangeTokens).toHaveBeenCalledWith({
        ...DEFAULT_DESIGN_TOKENS,
        fontFamily: 'Roboto, sans-serif',
      });
    });
  });

  describe('Color preset click emits new tokens (Requirements 4.4, 4.8)', () => {
    it('clicking a preset swatch emits a new token object with the chosen primary color', async () => {
      const user = userEvent.setup();
      const props = baseProps();
      render(<DesignSidebar {...props} />);

      // The default primaryColor is '#0f172a' (slate). Pick a different preset
      // so we observe a real value change in the emitted tokens.
      const swatch = screen.getByTestId('design-sidebar-color-#1e40af');

      await user.click(swatch);

      expect(props.onChangeTokens).toHaveBeenCalledTimes(1);
      expect(props.onChangeTokens).toHaveBeenCalledWith({
        ...DEFAULT_DESIGN_TOKENS,
        primaryColor: '#1e40af',
      });
    });
  });

  describe('Custom color input emits new tokens (Requirements 4.4, 4.8)', () => {
    it('changing the hidden <input type="color"> emits the picked color as primaryColor', () => {
      const props = baseProps();
      render(<DesignSidebar {...props} />);

      // The custom color input is the only <input type="color"> in the sidebar
      // and is labelled "Chọn màu tùy chỉnh" for accessibility.
      const colorInput = screen.getByLabelText(
        'Chọn màu tùy chỉnh',
      ) as HTMLInputElement;
      expect(colorInput.type).toBe('color');

      fireEvent.change(colorInput, { target: { value: '#abcdef' } });

      expect(props.onChangeTokens).toHaveBeenCalledTimes(1);
      expect(props.onChangeTokens).toHaveBeenCalledWith({
        ...DEFAULT_DESIGN_TOKENS,
        primaryColor: '#abcdef',
      });
    });
  });
});
