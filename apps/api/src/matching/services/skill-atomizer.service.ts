import { Injectable } from '@nestjs/common';
import { SkillAtom, SkillAtomSource } from '../types/skill-canonical.types';
import { SkillCanonicalizerService } from './skill-canonicalizer.service';

@Injectable()
export class SkillAtomizerService {
  constructor(private readonly skillCanonicalizer: SkillCanonicalizerService) {}

  atomizeSkills(skills: string[], source: SkillAtomSource): SkillAtom[] {
    const atoms = new Map<string, SkillAtom>();

    for (const skill of skills) {
      const normalized = this.skillCanonicalizer.normalizeLabel(skill);
      if (!normalized) {
        continue;
      }

      const grouped = this.splitGroupedSkill(normalized);
      for (const label of grouped.labels) {
        const canonical = this.skillCanonicalizer.canonicalize(label);
        if (!canonical || atoms.has(canonical)) {
          continue;
        }

        atoms.set(canonical, {
          raw: normalized,
          label,
          canonical,
          group: grouped.group,
          source,
        });
      }
    }

    return Array.from(atoms.values());
  }

  private splitGroupedSkill(value: string): {
    group: string | null;
    labels: string[];
  } {
    const groupMatch = value.match(/^([^:]{2,80}):\s*(.+)$/);
    if (groupMatch) {
      const group = this.skillCanonicalizer.normalizeLabel(groupMatch[1]);
      const labels = this.splitCompound(groupMatch[2]);
      if (group && labels.length > 0) {
        return { group, labels };
      }
    }

    return {
      group: null,
      labels: this.splitCompound(value),
    };
  }

  private splitCompound(value: string): string[] {
    const withLineBreaks = value
      .replace(/[•\u2022]/gu, '\n')
      .replace(/\s*\|\s*/g, '\n')
      .replace(/\s*;\s*/g, '\n')
      .replace(/\s*,\s*/g, '\n');

    const parts = withLineBreaks
      .split(/\r?\n/g)
      .map((entry) => entry.trim())
      .filter(Boolean)
      .flatMap((entry) => this.splitSafeSlash(entry));

    return parts
      .map((entry) => this.skillCanonicalizer.normalizeLabel(entry))
      .filter(Boolean);
  }

  private splitSafeSlash(value: string): string[] {
    if (!value.includes('/')) {
      return [value];
    }

    if (/^ci\/cd$/i.test(value.trim())) {
      return [value];
    }

    return value
      .split(/\s*\/\s*/g)
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
}
