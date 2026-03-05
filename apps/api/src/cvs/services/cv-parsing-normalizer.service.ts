import { Injectable } from '@nestjs/common';
import { CV_MAX_TEXT_CHARS } from '../cvs.constants';
import { CvNormalizedResult, CvParsedData } from '../cv-parser.types';

@Injectable()
export class CvParsingNormalizerService {
  normalize(parsed: unknown, rawText: string): CvNormalizedResult {
    const source = this.asRecord(parsed);
    const skills = this.normalizeSkills(source['skills']);

    const parsedData: CvParsedData = {
      skills,
      experience: this.normalizeObjectArray(source['experience']),
      education: this.normalizeObjectArray(source['education']),
      contact: this.asRecord(source['contact']),
      summary: this.normalizeSummary(source['summary'], rawText),
    };

    return {
      parsedData,
      skills,
    };
  }

  private normalizeSkills(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }

    const unique = new Set<string>();
    for (const item of value) {
      if (typeof item !== 'string') {
        continue;
      }
      const normalized = item.trim();
      if (!normalized) {
        continue;
      }
      unique.add(normalized);
    }

    return Array.from(unique).slice(0, 100);
  }

  private normalizeObjectArray(value: unknown): Array<Record<string, unknown>> {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map((item) => this.asRecord(item))
      .filter((item) => Object.keys(item).length > 0)
      .slice(0, 50);
  }

  private normalizeSummary(value: unknown, rawText: string): string {
    if (typeof value === 'string' && value.trim()) {
      return value.trim().slice(0, 2000);
    }
    return rawText.slice(0, Math.min(CV_MAX_TEXT_CHARS, 2000));
  }

  private asRecord(value: unknown): Record<string, unknown> {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
    return {};
  }
}
