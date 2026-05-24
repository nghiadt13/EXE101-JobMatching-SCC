/**
 * `withAlpha` interpolates an alpha channel onto a 6-digit hex color, returning
 * the corresponding 8-digit hex (`#RRGGBBAA`).
 *
 * This helper exists because Tailwind v4 cannot apply opacity modifiers (e.g.
 * `/10`) to a CSS variable that holds a hex string. The `ModernTemplate` uses
 * inline `style={{ backgroundColor: withAlpha(tokens.primaryColor) }}` to
 * produce a tinted pill background that matches the chosen accent color.
 *
 * Behavior:
 * - For a valid 6-digit hex input (`#RRGGBB`, case-insensitive), returns
 *   `#RRGGBB${alphaHex}` — a 9-character string in `#RRGGBBAA` form.
 * - For any other input (wrong length, missing `#`, non-hex characters, etc.),
 *   returns the input unchanged so the UI degrades gracefully without throwing.
 *
 * @param hexColor 6-digit hex color string like `#1e40af`.
 * @param alphaHex Two-character hex alpha channel. Defaults to `'1a'` (~10%).
 * @returns 8-digit hex (`#RRGGBBAA`) on valid input; the original `hexColor` on
 *          invalid input.
 */
export function withAlpha(hexColor: string, alphaHex: string = '1a'): string {
  if (typeof hexColor !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(hexColor)) {
    return hexColor;
  }

  if (typeof alphaHex !== 'string' || !/^[0-9a-fA-F]{2}$/.test(alphaHex)) {
    return hexColor;
  }

  return `${hexColor}${alphaHex}`;
}
