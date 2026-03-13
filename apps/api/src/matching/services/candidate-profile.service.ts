import { Injectable } from '@nestjs/common';
import type { NormalizedProfile } from '../../normalization/normalization.types';
import {
  CANDIDATE_PROFILE_VERSION,
  CandidateProfileV1,
} from '../types/schema-matching.types';

@Injectable()
export class CandidateProfileService {
  create(input: {
    normalizedProfile: NormalizedProfile | null;
    parsedData: Record<string, unknown>;
    skills: string[];
  }): CandidateProfileV1 {
    const profile = input.normalizedProfile;
    const parsedLanguages = this.readStringArray(input.parsedData.languages);
    const parsedCertifications = this.readStringArray(
      input.parsedData.certifications,
    );

    return {
      version: CANDIDATE_PROFILE_VERSION,
      headline: this.readString(profile?.title),
      summary:
        this.readString(profile?.summary) ||
        (typeof input.parsedData.summary === 'string'
          ? input.parsedData.summary.trim()
          : ''),
      skills: input.skills,
      experience:
        Array.isArray(profile?.experience) && profile.experience.length
          ? profile.experience
          : this.readExperience(input.parsedData.experience),
      education:
        Array.isArray(profile?.education) && profile.education.length
          ? profile.education
          : this.readEducation(input.parsedData.education),
      certifications:
        Array.isArray(profile?.certifications) && profile.certifications.length
          ? profile.certifications
          : parsedCertifications,
      languages:
        Array.isArray(profile?.languages) && profile.languages.length
          ? profile.languages
          : parsedLanguages,
      projects:
        Array.isArray(profile?.projects) && profile.projects.length
          ? profile.projects
          : this.readProjects(input.parsedData.projects),
      location:
        this.readProfileLocation(profile) ??
        this.readLocation(input.parsedData),
      warnings: this.buildWarnings(profile, input.skills),
    };
  }

  private readStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }
    return value
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 50);
  }

  private buildWarnings(
    normalizedProfile: NormalizedProfile | null,
    skills: string[],
  ): string[] {
    const warnings: string[] = [];
    if (normalizedProfile?.rawQuality?.needsManualReview) {
      warnings.push('CV parsing needs manual review.');
    }
    if (skills.length === 0) {
      warnings.push('No candidate skills were extracted.');
    }
    return warnings;
  }

  private readExperience(value: unknown): CandidateProfileV1['experience'] {
    if (!Array.isArray(value)) {
      return [];
    }
    return value
      .filter((item): item is Record<string, unknown> => this.isRecord(item))
      .map((item) => ({
        role: this.readString(item.role),
        company: this.readString(item.company),
        startDate: this.readNullableString(item.startDate),
        endDate: this.readNullableString(item.endDate),
        tech: this.readStringArray(item.tech),
      }))
      .filter((item) => item.role || item.company || item.tech.length)
      .slice(0, 20);
  }

  private readEducation(value: unknown): CandidateProfileV1['education'] {
    if (!Array.isArray(value)) {
      return [];
    }
    return value
      .filter((item): item is Record<string, unknown> => this.isRecord(item))
      .map((item) => ({
        school: this.readString(item.school),
        degree: this.readString(item.degree),
        field: this.readString(item.field),
        startDate: this.readNullableString(item.startDate),
        endDate: this.readNullableString(item.endDate),
      }))
      .filter((item) => item.school || item.degree || item.field)
      .slice(0, 20);
  }

  private readProjects(value: unknown): CandidateProfileV1['projects'] {
    if (!Array.isArray(value)) {
      return [];
    }
    return value
      .filter((item): item is Record<string, unknown> => this.isRecord(item))
      .map((item) => ({
        name: this.readString(item.name),
        description: this.readString(item.description),
        tech: this.readStringArray(item.tech),
      }))
      .filter((item) => item.name || item.description || item.tech.length)
      .slice(0, 20);
  }

  private readProfileLocation(
    profile: NormalizedProfile | null,
  ): CandidateProfileV1['location'] | null {
    const city = this.readString(profile?.location?.city);
    const country = this.readString(profile?.location?.country);
    return city || country ? { city, country } : null;
  }

  private readLocation(
    parsedData: Record<string, unknown>,
  ): CandidateProfileV1['location'] {
    const direct = this.asRecord(parsedData.location);
    const contact = this.asRecord(parsedData.contact);
    const contactLocation = this.asRecord(contact.location);
    const city = this.readString(direct.city || contactLocation.city);
    const country = this.readString(direct.country || contactLocation.country);
    return city || country ? { city, country } : null;
  }

  private readString(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
  }

  private readNullableString(value: unknown): string | null {
    const normalized = this.readString(value);
    return normalized || null;
  }

  private asRecord(value: unknown): Record<string, unknown> {
    return this.isRecord(value) ? value : {};
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === 'object' && !Array.isArray(value);
  }
}
