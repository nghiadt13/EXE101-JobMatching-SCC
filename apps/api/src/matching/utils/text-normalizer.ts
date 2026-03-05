const DEFAULT_MAX_TEXT_LENGTH = 50_000;

export function normalizeText(
  input: string,
  maxLength = DEFAULT_MAX_TEXT_LENGTH,
): string {
  if (!input) {
    return '';
  }

  const limited = input.slice(0, Math.max(0, maxLength));
  return limited
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeSkillsInput(skills: string[]): string[] {
  const unique = new Set<string>();
  for (const skill of skills) {
    const normalized = normalizeText(skill, 200);
    if (normalized) {
      unique.add(normalized);
    }
  }
  return Array.from(unique);
}
