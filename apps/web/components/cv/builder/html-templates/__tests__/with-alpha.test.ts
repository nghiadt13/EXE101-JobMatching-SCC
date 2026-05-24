import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { withAlpha } from '../with-alpha';

/**
 * Generator for valid 6-digit hex color strings (`#RRGGBB`).
 * Constrained to the hexadecimal alphabet so every generated value
 * matches /^#[0-9a-fA-F]{6}$/.
 */
const hexDigit = fc.constantFrom(
  '0',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  'a',
  'b',
  'c',
  'd',
  'e',
  'f',
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
);

const hexColorArb = fc
  .array(hexDigit, { minLength: 6, maxLength: 6 })
  .map((digits) => `#${digits.join('')}`);

describe('withAlpha (property tests)', () => {
  /**
   * Property 4: Hex Alpha Round-Trip
   * Validates: Requirements 5.7, 8.3
   *
   * For any valid 6-digit hex color `c`:
   *   - `withAlpha(c, 'ff')` ends with `'ff'` and has length 9 (`#RRGGBBAA`)
   *   - `withAlpha(c, '00')` ends with `'00'` and has length 9
   *   - `withAlpha(c)` defaults to `'1a'` alpha and has length 9
   *
   * For invalid hex inputs (wrong length, missing `#`, non-hex chars), the
   * function returns the input unchanged so the UI degrades gracefully.
   */
  it('appends ff alpha to any valid 6-digit hex', () => {
    fc.assert(
      fc.property(hexColorArb, (c) => {
        const result = withAlpha(c, 'ff');
        expect(result).toMatch(/ff$/);
        expect(result.length).toBe(9);
        expect(result.startsWith(c)).toBe(true);
      }),
    );
  });

  it('appends 00 alpha to any valid 6-digit hex', () => {
    fc.assert(
      fc.property(hexColorArb, (c) => {
        const result = withAlpha(c, '00');
        expect(result).toMatch(/00$/);
        expect(result.length).toBe(9);
        expect(result.startsWith(c)).toBe(true);
      }),
    );
  });

  it('defaults to 1a alpha when alpha argument is omitted', () => {
    fc.assert(
      fc.property(hexColorArb, (c) => {
        const result = withAlpha(c);
        expect(result).toMatch(/1a$/);
        expect(result.length).toBe(9);
        expect(result.startsWith(c)).toBe(true);
      }),
    );
  });

  it('returns the input unchanged for invalid hex inputs', () => {
    const invalidArb = fc.oneof(
      fc.constant(''),
      fc.constant('not-a-color'),
      fc.constant('#abc'), // 3-digit shorthand not supported
      fc.constant('#abcd'),
      fc.constant('#abcdef0'), // 7 chars after #
      fc.constant('abcdef'), // missing leading '#'
      fc.constant('#GGGGGG'), // non-hex chars
      fc.constant('#12345g'),
    );
    fc.assert(
      fc.property(invalidArb, (c) => {
        expect(withAlpha(c)).toBe(c);
        expect(withAlpha(c, 'ff')).toBe(c);
      }),
    );
  });
});
