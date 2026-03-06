import { Injectable, Logger } from '@nestjs/common';
import { GeminiClientService } from './gemini-client.service';
import {
  NORMALIZED_SCHEMA_VERSION,
  NormalizationResult,
  NormalizedProfile,
  ParseStatus,
} from './normalization.types';

type Domain = 'cv' | 'job';

@Injectable()
export class AiNormalizationService {
  private readonly logger = new Logger(AiNormalizationService.name);
  private readonly skillDictionary = [
    'javascript',
    'typescript',
    'node',
    'nestjs',
    'react',
    'next.js',
    'nextjs',
    'python',
    'django',
    'java',
    'spring',
    'sql',
    'postgresql',
    'mysql',
    'docker',
    'kubernetes',
    'aws',
    'gcp',
    'azure',
    'git',
    'html',
    'css',
  ];

  constructor(private readonly geminiClient: GeminiClientService) {}

  async normalizeCv(rawText: string): Promise<NormalizationResult> {
    return this.normalize('cv', rawText);
  }

  async normalizeJob(rawText: string): Promise<NormalizationResult> {
    return this.normalize('job', rawText);
  }

  private async normalize(
    domain: Domain,
    rawText: string,
  ): Promise<NormalizationResult> {
    const start = Date.now();
    if (!process.env['GEMINI_API_KEY']) {
      return this.createFallbackResult(domain, rawText, start);
    }

    const prompt = this.buildPrompt(domain, rawText);
    try {
      const first = await this.geminiClient.generateText(prompt);
      const directJson = this.extractJson(first);
      const parsed = directJson ?? (await this.tryRepairJson(first));

      if (!parsed) {
        return this.createFallbackResult(
          domain,
          rawText,
          start,
          'invalid_json_from_llm',
        );
      }

      const profile = this.normalizeProfile(parsed, domain, rawText);
      return {
        schemaVersion: NORMALIZED_SCHEMA_VERSION,
        status: this.estimateStatus(profile, false),
        profile,
        telemetry: {
          source: 'llm',
          fallbackUsed: false,
          latencyMs: Date.now() - start,
        },
      };
    } catch (error) {
      this.logger.warn(
        `LLM normalization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return this.createFallbackResult(domain, rawText, start);
    }
  }

  private buildPrompt(domain: Domain, rawText: string): string {
    const domainHint =
      domain === 'cv'
        ? 'Input is a candidate CV/resume.'
        : 'Input is a job description.';

    return [
      'Return strict JSON only. No markdown. No explanation.',
      domainHint,
      `Use schemaVersion="${NORMALIZED_SCHEMA_VERSION}" and this JSON shape:`,
      JSON.stringify(this.emptyProfileTemplate(domain), null, 2),
      'If data is missing, keep empty strings/arrays/nulls.',
      'Keep only factual information from input text.',
      '',
      'Text:',
      rawText,
    ].join('\n');
  }

  private async tryRepairJson(rawModelText: string): Promise<unknown> {
    const repairPrompt = [
      'Fix this to valid JSON only. Keep original keys and values.',
      rawModelText,
    ].join('\n');
    const repaired = await this.geminiClient.generateText(repairPrompt, 8000);
    return this.extractJson(repaired);
  }

  private extractJson(text: string): unknown {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      return null;
    }

    try {
      return JSON.parse(match[0]) as unknown;
    } catch {
      return null;
    }
  }

  private createFallbackResult(
    domain: Domain,
    rawText: string,
    start: number,
    reason = 'fallback_parser',
  ): NormalizationResult {
    const profile = this.fallbackProfile(domain, rawText, reason);
    return {
      schemaVersion: NORMALIZED_SCHEMA_VERSION,
      status: this.estimateStatus(profile, true),
      profile,
      telemetry: {
        source: 'fallback',
        fallbackUsed: true,
        latencyMs: Date.now() - start,
      },
    };
  }

  private fallbackProfile(
    domain: Domain,
    rawText: string,
    reason: string,
  ): NormalizedProfile {
    const normalized = rawText.toLowerCase();
    const skills = this.skillDictionary.filter((skill) =>
      normalized.includes(skill),
    );
    const summary = rawText.slice(0, 600);
    const title =
      domain === 'job'
        ? 'Unstructured job description'
        : 'Unstructured candidate profile';

    return {
      schemaVersion: NORMALIZED_SCHEMA_VERSION,
      language: this.detectLanguage(rawText),
      title,
      summary,
      skills,
      experience: [],
      education: [],
      certifications: [],
      projects: [],
      languages: [],
      location: { city: '', country: '' },
      rawQuality: {
        score: skills.length >= 2 ? 70 : 45,
        needsManualReview: true,
        reason,
      },
      ...(domain === 'job'
        ? {
            jobMeta: {
              requirements: [],
              benefits: [],
              employmentType: '',
            },
          }
        : {}),
    };
  }

  private normalizeProfile(
    raw: unknown,
    domain: Domain,
    rawText: string,
  ): NormalizedProfile {
    const src = this.asRecord(raw);
    const location = this.asRecord(src['location']);
    const jobMeta = this.asRecord(src['jobMeta']);

    return {
      schemaVersion: NORMALIZED_SCHEMA_VERSION,
      language: this.normalizeLanguage(src['language'], rawText),
      title: this.normalizeString(src['title']),
      summary: this.normalizeString(src['summary']).slice(0, 2000),
      skills: this.normalizeStringArray(src['skills'], 100),
      experience: this.normalizeExperience(src['experience']),
      education: this.normalizeEducation(src['education']),
      certifications: this.normalizeStringArray(src['certifications'], 50),
      projects: this.normalizeProjects(src['projects']),
      languages: this.normalizeStringArray(src['languages'], 20),
      location: {
        city: this.normalizeString(location['city']),
        country: this.normalizeString(location['country']),
      },
      rawQuality: {
        score: this.normalizeScore(this.asRecord(src['rawQuality'])['score']),
        needsManualReview: Boolean(
          this.asRecord(src['rawQuality'])['needsManualReview'],
        ),
        reason: this.normalizeString(
          this.asRecord(src['rawQuality'])['reason'],
        ),
      },
      ...(domain === 'job'
        ? {
            jobMeta: {
              requirements: this.normalizeStringArray(
                jobMeta['requirements'],
                100,
              ),
              benefits: this.normalizeStringArray(jobMeta['benefits'], 100),
              employmentType: this.normalizeString(jobMeta['employmentType']),
            },
          }
        : {}),
    };
  }

  private normalizeExperience(value: unknown): NormalizedProfile['experience'] {
    if (!Array.isArray(value)) {
      return [];
    }
    return value
      .map((item) => this.asRecord(item))
      .map((item) => ({
        role: this.normalizeString(item['role']),
        company: this.normalizeString(item['company']),
        startDate: this.normalizeDate(item['startDate']),
        endDate: this.normalizeDate(item['endDate']),
        highlights: this.normalizeStringArray(item['highlights'], 20),
      }))
      .filter((entry) => entry.role || entry.company || entry.highlights.length)
      .slice(0, 30);
  }

  private normalizeEducation(value: unknown): NormalizedProfile['education'] {
    if (!Array.isArray(value)) {
      return [];
    }
    return value
      .map((item) => this.asRecord(item))
      .map((item) => ({
        school: this.normalizeString(item['school']),
        degree: this.normalizeString(item['degree']),
        field: this.normalizeString(item['field']),
        startDate: this.normalizeDate(item['startDate']),
        endDate: this.normalizeDate(item['endDate']),
      }))
      .filter((entry) => entry.school || entry.degree || entry.field)
      .slice(0, 20);
  }

  private normalizeProjects(value: unknown): NormalizedProfile['projects'] {
    if (!Array.isArray(value)) {
      return [];
    }
    return value
      .map((item) => this.asRecord(item))
      .map((item) => ({
        name: this.normalizeString(item['name']),
        description: this.normalizeString(item['description']),
        tech: this.normalizeStringArray(item['tech'], 20),
      }))
      .filter((entry) => entry.name || entry.description || entry.tech.length)
      .slice(0, 20);
  }

  private normalizeString(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
  }

  private normalizeStringArray(value: unknown, max: number): string[] {
    if (!Array.isArray(value)) {
      return [];
    }
    const unique = new Set<string>();
    for (const item of value) {
      if (typeof item !== 'string') {
        continue;
      }
      const v = item.trim();
      if (!v) {
        continue;
      }
      unique.add(v);
    }
    return Array.from(unique).slice(0, max);
  }

  private normalizeLanguage(
    value: unknown,
    rawText: string,
  ): 'vi' | 'en' | 'mixed' {
    if (value === 'vi' || value === 'en' || value === 'mixed') {
      return value;
    }
    return this.detectLanguage(rawText);
  }

  private detectLanguage(rawText: string): 'vi' | 'en' | 'mixed' {
    const hasVietnameseChar =
      /[ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/i.test(
        rawText,
      );
    const hasEnglishWord =
      /\b(the|and|with|experience|skills|work|project)\b/i.test(rawText);
    if (hasVietnameseChar && hasEnglishWord) {
      return 'mixed';
    }
    return hasVietnameseChar ? 'vi' : 'en';
  }

  private normalizeScore(value: unknown): number {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return 0;
    }
    if (value < 0) return 0;
    if (value > 100) return 100;
    return Math.round(value);
  }

  private normalizeDate(value: unknown): string | null {
    if (typeof value !== 'string') {
      return null;
    }
    const v = value.trim();
    if (!v) {
      return null;
    }
    return /^\d{4}(-\d{2})?$/.test(v) ? v : null;
  }

  private asRecord(value: unknown): Record<string, unknown> {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
    return {};
  }

  private estimateStatus(
    profile: NormalizedProfile,
    fallbackUsed: boolean,
  ): ParseStatus {
    if (fallbackUsed) {
      return 'fallback';
    }
    if (profile.rawQuality.needsManualReview || profile.rawQuality.score < 60) {
      return 'needs_review';
    }
    return 'parsed_ok';
  }

  private emptyProfileTemplate(domain: Domain): NormalizedProfile {
    return {
      schemaVersion: NORMALIZED_SCHEMA_VERSION,
      language: 'mixed',
      title: '',
      summary: '',
      skills: [],
      experience: [],
      education: [],
      certifications: [],
      projects: [],
      languages: [],
      location: { city: '', country: '' },
      rawQuality: {
        score: 0,
        needsManualReview: true,
        reason: '',
      },
      ...(domain === 'job'
        ? {
            jobMeta: {
              requirements: [],
              benefits: [],
              employmentType: '',
            },
          }
        : {}),
    };
  }
}
