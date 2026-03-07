import { Injectable, Logger } from '@nestjs/common';
import { GeminiClientService } from './gemini-client.service';
import { LlmClient } from './llm-client.interface';
import { AiNormalizationError } from './normalization.errors';
import { OpenAiClientService } from './openai-client.service';
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

  constructor(
    private readonly geminiClient: GeminiClientService,
    private readonly openAiClient: OpenAiClientService,
  ) {}

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
    const client = this.resolveClient();
    const prompt = this.buildPrompt(domain, rawText);

    try {
      const first = await client.generateText(prompt);
      const directJson = this.extractJson(first);
      const parsed = directJson ?? (await this.tryRepairJson(client, first));

      if (!parsed) {
        throw new AiNormalizationError(
          'parse_failed',
          'AI normalization returned invalid JSON',
        );
      }

      const profile = this.normalizeProfile(parsed, domain, rawText);
      return {
        schemaVersion: NORMALIZED_SCHEMA_VERSION,
        status: this.estimateStatus(profile),
        profile,
        telemetry: {
          provider: client.provider,
          model: client.getModelName(),
          latencyMs: Date.now() - start,
        },
      };
    } catch (error) {
      this.logger.warn(
        `LLM normalization failed (${client.provider}): ${error instanceof Error ? error.message : 'Unknown error'}`,
      );

      if (error instanceof AiNormalizationError) {
        throw error;
      }
      throw new AiNormalizationError(
        'service_unavailable',
        'AI provider request failed',
      );
    }
  }

  private resolveClient(): LlmClient {
    const provider = (process.env['LLM_PROVIDER'] ?? 'gemini')
      .trim()
      .toLowerCase();
    if (provider === 'gemini') {
      return this.geminiClient;
    }
    if (provider === 'openai') {
      return this.openAiClient;
    }
    throw new AiNormalizationError(
      'service_unavailable',
      `Unsupported LLM provider: ${provider}`,
    );
  }

  private buildPrompt(domain: Domain, rawText: string): string {
    return [
      'You are an expert IT Recruiter AI.',
      'Analyze the following raw text extracted from a ' +
        (domain === 'cv' ? 'candidate CV' : 'Job Description') +
        '.',
      'CRITICAL INSTRUCTION: Read the ENTIRE document from start to finish. Extract ALL technical skills, tools, frameworks, platforms, protocols, and programming languages you can find into the "skills" array. Prefer atomic skill items like "AWS", "EC2", "S3", "Lambda" instead of grouped category strings. DO NOT summarize or omit technical keywords.',
      'For Experience and Education: Connect the dates, company/school names, and job titles even if they appear on separate or disjointed lines in the raw text.',
      '',
      'Return STRICT JSON ONLY. No markdown formatted blocks (e.g. no ```json), no explanations, no preamble.',
      `Use schemaVersion="${NORMALIZED_SCHEMA_VERSION}" and match this exact JSON structure:`,
      JSON.stringify(this.emptyProfileTemplate(domain), null, 2),
      'If a specific piece of data is missing, keep its value as an empty string, empty array, or null.',
      '',
      '--- START OF TEXT ---',
      rawText,
      '--- END OF TEXT ---',
    ].join('\n');
  }

  private async tryRepairJson(
    client: LlmClient,
    rawModelText: string,
  ): Promise<unknown> {
    const repairPrompt = [
      'Fix this to valid JSON only. Keep original keys and values.',
      rawModelText,
    ].join('\n');
    const repaired = await client.generateText(repairPrompt, 8000);
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
        tech: this.normalizeStringArray(item['tech'], 20),
      }))
      .filter((entry) => entry.role || entry.company || entry.tech.length)
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
        gpa: this.normalizeString(item['gpa']),
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

  private estimateStatus(profile: NormalizedProfile): ParseStatus {
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
      skills: [''],
      experience: [
        {
          role: '',
          company: '',
          startDate: 'YYYY-MM',
          endDate: 'YYYY-MM',
          tech: [''],
        },
      ],
      education: [
        {
          school: '',
          degree: '',
          field: '',
          startDate: 'YYYY-MM',
          endDate: 'YYYY-MM',
          gpa: '',
        },
      ],
      certifications: [''],
      projects: [
        {
          name: '',
          description: '',
          tech: [''],
        },
      ],
      languages: [''],
      location: { city: '', country: '' },
      rawQuality: {
        score: 0,
        needsManualReview: true,
        reason: '',
      },
      ...(domain === 'job'
        ? {
            jobMeta: {
              requirements: [''],
              benefits: [''],
              employmentType: '',
            },
          }
        : {}),
    } as NormalizedProfile;
  }
}
