import { Injectable } from '@nestjs/common';
import {
  CandidateProfileV1,
  RequirementItem,
  RequirementsSchemaV1,
  RequirementStatus,
  SCHEMA_MATCHING_SNAPSHOT_VERSION,
  SchemaMatchingSnapshot,
  SchemaRequirementEvaluation,
} from '../types/schema-matching.types';

@Injectable()
export class SchemaMatchingEvaluatorService {
  evaluate(
    requirementsSchema: RequirementsSchemaV1,
    candidateProfile: CandidateProfileV1,
  ): { finalScorePercent: number; snapshot: SchemaMatchingSnapshot } {
    const requirements = [
      ...requirementsSchema.mustHaves,
      ...requirementsSchema.niceToHaves,
    ].map((requirement) =>
      this.evaluateRequirement(requirement, candidateProfile),
    );

    const mustHave = this.averageScore(
      requirements.filter(
        (item) =>
          item.importance === 'must_have' &&
          !this.isCategoryBucketRequirement(item),
      ),
    );
    const niceToHave = this.averageScore(
      requirements.filter(
        (item) =>
          item.importance === 'nice_to_have' &&
          !this.isCategoryBucketRequirement(item),
      ),
    );
    const experience = this.averageScore(
      requirements.filter((item) => item.category === 'experience'),
    );
    const education = this.averageScore(
      requirements.filter((item) => item.category === 'education'),
    );
    const language = this.averageScore(
      requirements.filter((item) => item.category === 'language'),
    );
    const location = this.scoreLocation(requirementsSchema, candidateProfile);

    const final = Math.round(
      mustHave * 0.5 +
        niceToHave * 0.15 +
        experience * 0.15 +
        education * 0.07 +
        language * 0.08 +
        location * 0.05,
    );

    return {
      finalScorePercent: final,
      snapshot: {
        version: SCHEMA_MATCHING_SNAPSHOT_VERSION,
        scoreBreakdown: {
          mustHave: Math.round(mustHave),
          niceToHave: Math.round(niceToHave),
          experience: Math.round(experience),
          education: Math.round(education),
          language: Math.round(language),
          location: Math.round(location),
          final,
        },
        requirements,
        strengths: requirements
          .filter((item) => item.status === 'met')
          .slice(0, 4)
          .map((item) => item.label),
        gaps: requirements
          .filter((item) => item.status === 'missing')
          .slice(0, 4)
          .map((item) => item.label),
        warnings: Array.from(
          new Set([
            ...requirementsSchema.warnings,
            ...candidateProfile.warnings,
          ]),
        ).slice(0, 6),
      },
    };
  }

  private evaluateRequirement(
    requirement: RequirementItem,
    candidateProfile: CandidateProfileV1,
  ): SchemaRequirementEvaluation {
    const evidence = this.collectEvidence(requirement, candidateProfile);
    const status = this.resolveStatus(requirement, candidateProfile, evidence);

    return {
      id: requirement.id,
      label: requirement.label,
      category: requirement.category,
      importance: requirement.importance,
      status,
      evidence: evidence.slice(0, 3),
    };
  }

  private resolveStatus(
    requirement: RequirementItem,
    candidateProfile: CandidateProfileV1,
    evidence: string[],
  ): RequirementStatus {
    if (requirement.category === 'experience' && requirement.minimumMonths) {
      const relevantMonths = this.relevantExperienceMonths(
        candidateProfile,
        requirement.keywords,
      );
      if (relevantMonths >= requirement.minimumMonths) {
        return 'met';
      }
      if (relevantMonths > 0 || evidence.length > 0) {
        return 'partial';
      }
      return 'missing';
    }

    if (evidence.length >= 2) {
      return 'met';
    }
    if (evidence.length === 1) {
      return 'partial';
    }
    return 'missing';
  }

  private collectEvidence(
    requirement: RequirementItem,
    candidateProfile: CandidateProfileV1,
  ): string[] {
    const evidence: string[] = [];
    const keywords = requirement.keywords;
    const profileSkills = candidateProfile.skills.map((skill) =>
      skill.toLowerCase(),
    );

    for (const skill of candidateProfile.skills) {
      if (keywords.some((keyword) => skill.toLowerCase().includes(keyword))) {
        evidence.push(`Skill: ${skill}`);
      }
    }

    for (const experience of candidateProfile.experience) {
      const haystack = [experience.role, experience.company, ...experience.tech]
        .join(' ')
        .toLowerCase();
      if (keywords.some((keyword) => haystack.includes(keyword))) {
        evidence.push(
          `Experience: ${experience.role || experience.company}`.trim(),
        );
      }
    }

    for (const project of candidateProfile.projects) {
      const haystack = [project.name, project.description, ...project.tech]
        .join(' ')
        .toLowerCase();
      if (keywords.some((keyword) => haystack.includes(keyword))) {
        evidence.push(`Project: ${project.name || project.description}`.trim());
      }
    }

    for (const language of candidateProfile.languages) {
      if (
        keywords.some((keyword) => language.toLowerCase().includes(keyword))
      ) {
        evidence.push(`Language: ${language}`);
      }
    }

    for (const certification of candidateProfile.certifications) {
      if (
        keywords.some((keyword) =>
          certification.toLowerCase().includes(keyword),
        )
      ) {
        evidence.push(`Certification: ${certification}`);
      }
    }

    if (
      requirement.category === 'education' &&
      candidateProfile.education.some((entry) =>
        keywords.some((keyword) =>
          [entry.degree, entry.field, entry.school]
            .join(' ')
            .toLowerCase()
            .includes(keyword),
        ),
      )
    ) {
      evidence.push('Education background matches requirement');
    }

    if (
      requirement.category === 'skill' &&
      evidence.length === 0 &&
      profileSkills.some((skill) =>
        keywords.some(
          (keyword) => keyword.includes(skill) || skill.includes(keyword),
        ),
      )
    ) {
      evidence.push('Related skill evidence found');
    }

    return Array.from(new Set(evidence));
  }

  private averageScore(items: SchemaRequirementEvaluation[]): number {
    if (items.length === 0) {
      return 100;
    }
    const total = items.reduce(
      (sum, item) => sum + this.statusScore(item.status),
      0,
    );
    return total / items.length;
  }

  private statusScore(status: RequirementStatus): number {
    switch (status) {
      case 'met':
        return 100;
      case 'partial':
        return 55;
      case 'not_applicable':
        return 100;
      default:
        return 0;
    }
  }

  private scoreLocation(
    requirementsSchema: RequirementsSchemaV1,
    candidateProfile: CandidateProfileV1,
  ): number {
    const locationPreference = requirementsSchema.locationPreference;
    if (!locationPreference) {
      return 100;
    }
    if (locationPreference.remote) {
      return 100;
    }
    const city = candidateProfile.location?.city.toLowerCase() ?? '';
    const country = candidateProfile.location?.country.toLowerCase() ?? '';
    if (
      (locationPreference.city &&
        city === locationPreference.city.toLowerCase()) ||
      (locationPreference.country &&
        country === locationPreference.country.toLowerCase())
    ) {
      return 100;
    }
    if (city || country) {
      return 40;
    }
    return 0;
  }

  private isCategoryBucketRequirement(
    requirement: SchemaRequirementEvaluation,
  ): boolean {
    return (
      requirement.category === 'experience' ||
      requirement.category === 'education' ||
      requirement.category === 'language' ||
      requirement.category === 'location'
    );
  }

  private relevantExperienceMonths(
    candidateProfile: CandidateProfileV1,
    keywords: string[],
  ): number {
    if (keywords.length === 0) {
      return this.totalExperienceMonths(candidateProfile);
    }
    return candidateProfile.experience.reduce((sum, entry) => {
      const haystack = [entry.role, entry.company, ...entry.tech]
        .join(' ')
        .toLowerCase();
      if (!keywords.some((keyword) => haystack.includes(keyword))) {
        return sum;
      }
      const start = this.toMonthIndex(entry.startDate);
      const end = this.toMonthIndex(entry.endDate) ?? this.currentMonthIndex();
      if (start === null || end === null || end < start) {
        return sum;
      }
      return sum + (end - start + 1);
    }, 0);
  }

  private totalExperienceMonths(candidateProfile: CandidateProfileV1): number {
    return candidateProfile.experience.reduce((sum, entry) => {
      const start = this.toMonthIndex(entry.startDate);
      const end = this.toMonthIndex(entry.endDate) ?? this.currentMonthIndex();
      if (start === null || end === null || end < start) {
        return sum;
      }
      return sum + (end - start + 1);
    }, 0);
  }

  private toMonthIndex(value: string | null): number | null {
    if (!value) {
      return null;
    }
    const match = value.match(/^(\d{4})(?:-(\d{2}))?$/);
    if (!match) {
      return null;
    }
    const year = Number(match[1]);
    const month = Number(match[2] ?? '01');
    return year * 12 + (month - 1);
  }

  private currentMonthIndex(): number {
    const now = new Date();
    return now.getUTCFullYear() * 12 + now.getUTCMonth();
  }
}
