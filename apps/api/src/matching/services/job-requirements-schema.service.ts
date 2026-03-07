import { Injectable } from '@nestjs/common';
import type { NormalizedProfile } from '../../normalization/normalization.types';
import {
  REQUIREMENTS_SCHEMA_VERSION,
  RequirementCategory,
  RequirementImportance,
  RequirementItem,
  RequirementsSchemaV1,
} from '../types/schema-matching.types';

@Injectable()
export class JobRequirementsSchemaService {
  create(input: {
    title: string;
    summary: string;
    skills: string[];
    description: string;
    normalizedProfile: NormalizedProfile | null;
    location: Record<string, unknown> | null;
  }): RequirementsSchemaV1 {
    const mustHaves: RequirementItem[] = [];
    const niceToHaves: RequirementItem[] = [];
    const seen = new Set<string>();
    const requirements = [
      ...(input.normalizedProfile?.jobMeta?.requirements ?? []),
      ...this.extractFallbackRequirements(input.description),
    ];

    for (const skill of input.skills) {
      const item = this.createRequirement(skill, 'skill', 'must_have');
      if (this.acceptRequirement(item, seen)) {
        mustHaves.push(item);
      }
    }

    for (const rawRequirement of requirements) {
      const importance = this.detectImportance(rawRequirement);
      const category = this.detectCategory(rawRequirement);
      const item = this.createRequirement(rawRequirement, category, importance);
      if (!this.acceptRequirement(item, seen)) {
        continue;
      }
      if (importance === 'nice_to_have') {
        niceToHaves.push(item);
      } else {
        mustHaves.push(item);
      }
    }

    return {
      version: REQUIREMENTS_SCHEMA_VERSION,
      roleTitle: input.title.trim(),
      summary: input.summary.trim(),
      mustHaves,
      niceToHaves,
      locationPreference: this.readLocationPreference(input.location),
      warnings: this.buildWarnings(input.normalizedProfile, mustHaves),
    };
  }

  private createRequirement(
    label: string,
    category: RequirementCategory,
    importance: RequirementImportance,
  ): RequirementItem {
    const normalizedLabel = label.trim();
    const slug = normalizedLabel
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 64);

    return {
      id: `${importance}-${category}-${slug || 'requirement'}`,
      label: normalizedLabel,
      category,
      importance,
      keywords: this.extractKeywords(normalizedLabel),
      minimumMonths: this.extractMinimumMonths(normalizedLabel),
    };
  }

  private acceptRequirement(item: RequirementItem, seen: Set<string>): boolean {
    if (!item.label || item.keywords.length === 0) {
      return false;
    }
    const key = `${item.category}:${item.keywords.join('|')}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  }

  private detectImportance(value: string): RequirementImportance {
    return /(nice to have|preferred|plus|bonus|advantage)/i.test(value)
      ? 'nice_to_have'
      : 'must_have';
  }

  private detectCategory(value: string): RequirementCategory {
    if (/(english|vietnamese|japanese|language|ielts|toeic)/i.test(value)) {
      return 'language';
    }
    if (/(degree|bachelor|master|graduate|university|college)/i.test(value)) {
      return 'education';
    }
    if (/(certificate|certification|aws certified|azure certified)/i.test(value)) {
      return 'certification';
    }
    if (/(remote|onsite|hybrid|location|based in|relocate)/i.test(value)) {
      return 'location';
    }
    if (/(year|years|month|months|experience|internship|hands-on)/i.test(value)) {
      return 'experience';
    }
    return this.extractKeywords(value).length <= 4 ? 'skill' : 'general';
  }

  private extractKeywords(value: string): string[] {
    const cleaned = value
      .toLowerCase()
      .replace(/[()/:,+]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const tokens = cleaned
      .split(' ')
      .filter((token) => token.length >= 2)
      .filter((token) => !this.stopWords.has(token));
    return Array.from(new Set(tokens)).slice(0, 12);
  }

  private extractMinimumMonths(value: string): number | null {
    const yearMatch = value.match(/(\d+)\s*\+?\s*(year|years)/i);
    if (yearMatch) {
      return Number(yearMatch[1]) * 12;
    }
    const monthMatch = value.match(/(\d+)\s*\+?\s*(month|months)/i);
    if (monthMatch) {
      return Number(monthMatch[1]);
    }
    return null;
  }

  private readLocationPreference(location: Record<string, unknown> | null) {
    if (!location) {
      return null;
    }
    const city = typeof location.city === 'string' ? location.city.trim() : '';
    const country =
      typeof location.country === 'string' ? location.country.trim() : '';
    const remote = Boolean(location.remote);
    return city || country || remote ? { city, country, remote } : null;
  }

  private buildWarnings(
    normalizedProfile: NormalizedProfile | null,
    mustHaves: RequirementItem[],
  ): string[] {
    const warnings: string[] = [];
    if (normalizedProfile?.rawQuality.needsManualReview) {
      warnings.push('Job parsing needs manual review.');
    }
    if (mustHaves.length === 0) {
      warnings.push('No structured requirements were extracted for scoring.');
    }
    return warnings;
  }

  private extractFallbackRequirements(description: string): string[] {
    return description
      .split(/\r?\n/)
      .map((line) => line.trim())
      .map((line) => line.replace(/^[-*•\d.\)\s]+/, '').trim())
      .filter((line) => line.length >= 8)
      .filter((line) => /(must|required|requirement|preferred|bonus|plus|experience|degree|language|certification|remote|hybrid)/i.test(line))
      .slice(0, 20);
  }

  private readonly stopWords = new Set([
    'and', 'the', 'for', 'with', 'from', 'that', 'have', 'will', 'must', 'your',
    'this', 'role', 'years', 'year', 'months', 'month', 'experience', 'plus',
    'nice', 'preferred', 'ability', 'strong', 'good', 'using', 'knowledge',
  ]);
}