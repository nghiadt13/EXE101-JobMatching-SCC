import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { SkillAtom, SkillAtomSource } from '../types/skill-canonical.types';
import { SkillAtomizerService } from './skill-atomizer.service';

@Injectable()
export class SkillStorageAdapterService {
  constructor(private readonly skillAtomizer: SkillAtomizerService) {}

  toStoredSkills(skills: string[], source: SkillAtomSource) {
    const displaySkills = this.normalizeDisplaySkills(skills);
    return {
      skills: displaySkills,
      skillAtoms: this.skillAtomizer.atomizeSkills(displaySkills, source),
    };
  }

  readSkillAtoms(value: Prisma.JsonValue | null | undefined): SkillAtom[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map((entry) => this.asRecord(entry))
      .map((entry) => ({
        raw: this.readString(entry.raw),
        label: this.readString(entry.label),
        canonical: this.readString(entry.canonical),
        group: this.readNullableString(entry.group),
        source: this.readSkillSource(entry.source),
      }))
      .filter((entry) => entry.label && entry.canonical);
  }

  private normalizeDisplaySkills(skills: string[]): string[] {
    const unique = new Set<string>();
    for (const skill of skills) {
      const value = typeof skill === 'string' ? skill.trim() : '';
      if (value) {
        unique.add(value);
      }
    }
    return Array.from(unique).slice(0, 100);
  }

  private asRecord(value: Prisma.JsonValue): Record<string, Prisma.JsonValue> {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, Prisma.JsonValue>)
      : {};
  }

  private readString(value: Prisma.JsonValue | undefined): string {
    return typeof value === 'string' ? value.trim() : '';
  }

  private readNullableString(
    value: Prisma.JsonValue | undefined,
  ): string | null {
    const normalized = this.readString(value);
    return normalized || null;
  }

  private readSkillSource(
    value: Prisma.JsonValue | undefined,
  ): SkillAtomSource {
    return value === 'cv_parsed' ||
      value === 'cv_manual' ||
      value === 'job_parsed' ||
      value === 'job_manual' ||
      value === 'legacy'
      ? value
      : 'legacy';
  }
}
