import { Injectable } from '@nestjs/common';
import { MatchingBreakdown } from '../matching.types';
import { SkillAtom } from '../types/skill-canonical.types';
import { normalizeSkillsInput } from '../utils/text-normalizer';

type SkillInput = string | SkillAtom;

@Injectable()
export class SkillsCalculatorService {
  calculateSkillsScore(
    cvSkills: SkillInput[],
    jobSkills: SkillInput[],
  ): number {
    const normalizedCvSkills = new Set(
      this.toComparableSkills(cvSkills).map((entry) => entry.canonical),
    );
    const normalizedJobSkills = this.toComparableSkills(jobSkills);
    if (normalizedJobSkills.length === 0) {
      return 0;
    }

    let matched = 0;
    for (const skill of normalizedJobSkills) {
      if (normalizedCvSkills.has(skill.canonical)) {
        matched += 1;
      }
    }

    return Number((matched / normalizedJobSkills.length).toFixed(4));
  }

  calculateBreakdown(
    cvSkills: SkillInput[],
    jobSkills: SkillInput[],
  ): MatchingBreakdown {
    const cvSet = new Set(
      this.toComparableSkills(cvSkills).map((entry) => entry.canonical),
    );
    const jobCanonicalMap = new Map<string, string>();
    for (const skill of this.toComparableSkills(jobSkills)) {
      if (!jobCanonicalMap.has(skill.canonical)) {
        jobCanonicalMap.set(skill.canonical, skill.label);
      }
    }

    const matchedSkills: string[] = [];
    const missingSkills: string[] = [];
    for (const [normalized, canonical] of jobCanonicalMap.entries()) {
      if (cvSet.has(normalized)) {
        matchedSkills.push(canonical);
      } else {
        missingSkills.push(canonical);
      }
    }

    return { matchedSkills, missingSkills };
  }

  private toComparableSkills(skills: SkillInput[]) {
    return skills
      .map((skill) => {
        if (typeof skill === 'string') {
          const canonical = normalizeSkillsInput([skill])[0] ?? '';
          return {
            canonical,
            label: skill.trim(),
          };
        }

        return {
          canonical: skill.canonical.trim(),
          label: skill.label.trim(),
        };
      })
      .filter((entry) => entry.canonical && entry.label);
  }
}
