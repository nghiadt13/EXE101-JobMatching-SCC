import { Injectable } from '@nestjs/common';
import { MatchingBreakdown } from '../matching.types';
import { normalizeSkillsInput } from '../utils/text-normalizer';

@Injectable()
export class SkillsCalculatorService {
  calculateSkillsScore(cvSkills: string[], jobSkills: string[]): number {
    const normalizedCvSkills = new Set(normalizeSkillsInput(cvSkills));
    const normalizedJobSkills = normalizeSkillsInput(jobSkills);
    if (normalizedJobSkills.length === 0) {
      return 0;
    }

    let matched = 0;
    for (const skill of normalizedJobSkills) {
      if (normalizedCvSkills.has(skill)) {
        matched += 1;
      }
    }

    return Number((matched / normalizedJobSkills.length).toFixed(4));
  }

  calculateBreakdown(
    cvSkills: string[],
    jobSkills: string[],
  ): MatchingBreakdown {
    const cvSet = new Set(normalizeSkillsInput(cvSkills));
    const jobCanonicalMap = new Map<string, string>();
    for (const skill of jobSkills) {
      const normalized = normalizeSkillsInput([skill])[0];
      if (normalized && !jobCanonicalMap.has(normalized)) {
        jobCanonicalMap.set(normalized, skill.trim());
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
}
