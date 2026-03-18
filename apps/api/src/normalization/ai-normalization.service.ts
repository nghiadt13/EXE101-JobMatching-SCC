import { Injectable } from '@nestjs/common';
import { AppLogger } from '../common/logging/app-logger.service';
import { GeminiClientService } from './gemini-client.service';
import { LlmClient } from './llm-client.interface';
import { classifyLlmError } from './llm-error-classifier';
import { AiNormalizationError } from './normalization.errors';
import { KimiClientService } from './kimi-client.service';
import {
  NORMALIZED_SCHEMA_VERSION,
  NormalizationResult,
  NormalizedProfile,
  ParseStatus,
} from './normalization.types';
import {
  JdContextualEvaluation,
  RequirementsSchemaV2,
  JD_CONTEXTUAL_EVAL_V1,
} from '../matching/types/schema-matching.types';

type Domain = 'cv' | 'job';

const MAX_NORMALIZATION_TIMEOUT_MS = 60_000;
const REPAIR_TIMEOUT_CAP_MS = 8_000;

@Injectable()
export class AiNormalizationService {
  constructor(
    private readonly logger: AppLogger,
    private readonly geminiClient: GeminiClientService,
    private readonly kimiClient: KimiClientService,
  ) {}

  async normalizeCv(rawText: string): Promise<NormalizationResult> {
    return this.normalize('cv', rawText);
  }

  async normalizeJob(rawText: string): Promise<NormalizationResult> {
    return this.normalize('job', rawText);
  }

  async evaluateCvAgainstJd(
    cvRawText: string,
    requirementsSchema: RequirementsSchemaV2,
  ): Promise<JdContextualEvaluation> {
    const start = Date.now();
    const deadline = start + this.readNormalizationTimeoutMs();
    const client = this.resolveClient();
    const prompt = this.buildJdEvalPrompt(cvRawText, requirementsSchema);

    try {
      const first = await client.generateText(
        prompt,
        this.readRemainingTimeMs(deadline),
      );
      const directJson = this.extractJson(first);
      const parsed =
        directJson ?? (await this.tryRepairJson(client, first, deadline));

      if (!parsed) {
        throw new AiNormalizationError(
          'parse_failed',
          'JD evaluation returned invalid JSON',
        );
      }

      const evaluation = this.normalizeJdEvaluation(parsed, requirementsSchema);
      this.logger.info('jd_cv_evaluation_completed', {
        provider: client.provider,
        model: client.getModelName(),
        latencyMs: Date.now() - start,
        requirementsCount: requirementsSchema.requirements.length,
        constraintsCount: requirementsSchema.constraints.length,
      });
      return evaluation;
    } catch (error) {
      const failure =
        error instanceof AiNormalizationError && error.details
          ? error.details
          : classifyLlmError(error);
      this.logger.warn('jd_cv_evaluation_failed', {
        provider: client.provider,
        model: client.getModelName(),
        latencyMs: Date.now() - start,
        failureCategory: failure.category,
        reason: failure.reason,
      });
      if (error instanceof AiNormalizationError) throw error;
      throw new AiNormalizationError(
        'service_unavailable',
        'LLM provider request failed',
        failure,
      );
    }
  }

  private async normalize(
    domain: Domain,
    rawText: string,
  ): Promise<NormalizationResult> {
    const start = Date.now();
    const deadline = start + this.readNormalizationTimeoutMs();
    const client = this.resolveClient();
    const prompt = this.buildPrompt(domain, rawText);

    try {
      const first = await client.generateText(
        prompt,
        this.readRemainingTimeMs(deadline),
      );
      const directJson = this.extractJson(first);
      const parsed =
        directJson ?? (await this.tryRepairJson(client, first, deadline));

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
      const failure =
        error instanceof AiNormalizationError && error.details
          ? error.details
          : classifyLlmError(error);
      this.logger.warn('ai_normalization_failed', {
        domain,
        provider: client.provider,
        model: client.getModelName(),
        latencyMs: Date.now() - start,
        failureCategory: failure.category,
        upstreamStatusCode: failure.statusCode ?? undefined,
        upstreamCode: failure.providerCode ?? undefined,
        retryable: failure.retryable,
        reason: failure.reason,
      });

      if (error instanceof AiNormalizationError) {
        throw error;
      }
      throw new AiNormalizationError(
        'service_unavailable',
        'AI provider request failed',
        failure,
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
    if (provider === 'kimi') {
      return this.kimiClient;
    }
    throw new AiNormalizationError(
      'service_unavailable',
      `Unsupported LLM provider: ${provider}`,
    );
  }

  private buildJdEvalPrompt(
    cvRawText: string,
    schema: RequirementsSchemaV2,
  ): string {
    const outputTemplate = {
      version: JD_CONTEXTUAL_EVAL_V1,
      requirementEvaluations: schema.requirements.map((r) => ({
        requirementId: r.id,
        status: 'met | partial | missing | not_applicable',
        evidence: ['quote or fact from CV'],
        confidence: 'high | medium | low',
      })),
      constraintEvaluations: schema.constraints.map((c) => ({
        constraintId: c.id,
        met: true,
        evidence: 'brief explanation',
      })),
      candidateSummary: {
        headline: '',
        totalExperienceMonths: 0,
        relevantExperienceMonths: 0,
        skills: [],
        location: null,
        projectRelevance: {
          totalProjects: 0,
          relevantProjects: 0,
          relevanceScore: 0,
          highlights: [
            'Project X used React and TypeScript which match the JD requirements',
          ],
        },
      },
      warnings: [],
    };

    return [
      "You are an HR evaluation assistant. Given a job's requirements and a candidate's CV text, evaluate how well the candidate meets each requirement.",
      '',
      '## Job Requirements Schema',
      JSON.stringify(schema, null, 2),
      '',
      '## Candidate CV Text',
      '--- START OF CV ---',
      cvRawText,
      '--- END OF CV ---',
      '',
      '## Instructions',
      'For each requirement in requirementEvaluations:',
      '  - status: "met" (strong evidence), "partial" (some evidence but incomplete), "missing" (no evidence), "not_applicable" (requirement clearly does not apply)',
      '  - evidence: 1-3 brief quotes or facts from the CV that support your assessment',
      '  - confidence: "high", "medium", or "low"',
      '',
      'For each constraint in constraintEvaluations:',
      '  - met: true/false',
      '  - evidence: brief explanation',
      '',
      'Extract a brief candidateSummary relevant only to this JD.',
      '',
      'For projectRelevance in candidateSummary:',
      '  - totalProjects: count all projects/portfolios/side-projects mentioned in the CV',
      '  - relevantProjects: count those using technologies or domains relevant to this JD',
      '  - relevanceScore: 0-100 score based on how relevant the projects are to this JD',
      '    (0 = no projects at all, 30 = projects exist but unrelated,',
      '     60 = some relevant tech used, 100 = highly relevant projects with matching tech stack)',
      '  - highlights: 1-3 brief descriptions of the most relevant projects',
      '  - If CV has NO projects section, set totalProjects=0, relevantProjects=0, relevanceScore=0, highlights=[]',
      '',
      '## Output Format',
      'Return STRICT JSON ONLY. No markdown, no preamble. Match this exact structure:',
      JSON.stringify(outputTemplate, null, 2),
    ].join('\n');
  }

  private normalizeJdEvaluation(
    raw: unknown,
    schema: RequirementsSchemaV2,
  ): JdContextualEvaluation {
    const src = this.asRecord(raw);
    const requirementIds = new Set(schema.requirements.map((r) => r.id));
    const constraintIds = new Set(schema.constraints.map((c) => c.id));
    const validStatuses = new Set([
      'met',
      'partial',
      'missing',
      'not_applicable',
    ]);
    const validConfidences = new Set(['high', 'medium', 'low']);

    const rawReqEvals = Array.isArray(src['requirementEvaluations'])
      ? (src['requirementEvaluations'] as unknown[])
      : [];
    const requirementEvaluations = rawReqEvals
      .map((item) => this.asRecord(item))
      .filter((item) => requirementIds.has(item['requirementId'] as string))
      .map((item) => ({
        requirementId: String(item['requirementId'] ?? ''),
        label: '',
        importance: 'medium' as const,
        category: 'general' as const,
        status: validStatuses.has(String(item['status']))
          ? (String(item['status']) as
              | 'met'
              | 'partial'
              | 'missing'
              | 'not_applicable')
          : ('missing' as const),
        evidence: Array.isArray(item['evidence'])
          ? (item['evidence'] as unknown[])
              .filter((e) => typeof e === 'string')
              .slice(0, 3)
          : [],
        confidence: validConfidences.has(String(item['confidence']))
          ? (String(item['confidence']) as 'high' | 'medium' | 'low')
          : ('low' as const),
      }));

    // Ensure all requirements have an evaluation (fill missing with 'missing')
    for (const req of schema.requirements) {
      if (!requirementEvaluations.find((e) => e.requirementId === req.id)) {
        requirementEvaluations.push({
          requirementId: req.id,
          label: '',
          importance: 'medium' as const,
          category: 'general' as const,
          status: 'missing',
          evidence: [],
          confidence: 'low',
        });
      }
    }

    const rawConstraintEvals = Array.isArray(src['constraintEvaluations'])
      ? (src['constraintEvaluations'] as unknown[])
      : [];
    const constraintEvaluations = rawConstraintEvals
      .map((item) => this.asRecord(item))
      .filter((item) => constraintIds.has(item['constraintId'] as string))
      .map((item) => ({
        constraintId: String(item['constraintId'] ?? ''),
        label: '',
        met: Boolean(item['met']),
        evidence: typeof item['evidence'] === 'string' ? item['evidence'] : '',
      }));

    for (const constraint of schema.constraints) {
      if (
        !constraintEvaluations.find((e) => e.constraintId === constraint.id)
      ) {
        constraintEvaluations.push({
          constraintId: constraint.id,
          label: '',
          met: false,
          evidence: '',
        });
      }
    }

    const summary = this.asRecord(src['candidateSummary']);
    const summaryLocation = this.asRecord(summary['location']);
    const rawProjectRelevance = this.asRecord(summary['projectRelevance']);

    return {
      version: JD_CONTEXTUAL_EVAL_V1,
      requirementEvaluations,
      constraintEvaluations,
      candidateSummary: {
        headline:
          typeof summary['headline'] === 'string' ? summary['headline'] : '',
        totalExperienceMonths:
          typeof summary['totalExperienceMonths'] === 'number'
            ? Math.max(0, Math.round(summary['totalExperienceMonths']))
            : 0,
        relevantExperienceMonths:
          typeof summary['relevantExperienceMonths'] === 'number'
            ? Math.max(0, Math.round(summary['relevantExperienceMonths']))
            : 0,
        skills: Array.isArray(summary['skills'])
          ? (summary['skills'] as unknown[]).filter(
              (s) => typeof s === 'string',
            )
          : [],
        location:
          typeof summaryLocation['city'] === 'string' ||
          typeof summaryLocation['country'] === 'string'
            ? {
                city:
                  typeof summaryLocation['city'] === 'string'
                    ? summaryLocation['city']
                    : '',
                country:
                  typeof summaryLocation['country'] === 'string'
                    ? summaryLocation['country']
                    : '',
              }
            : null,
        projectRelevance: {
          totalProjects:
            typeof rawProjectRelevance['totalProjects'] === 'number'
              ? Math.max(0, Math.round(rawProjectRelevance['totalProjects']))
              : 0,
          relevantProjects:
            typeof rawProjectRelevance['relevantProjects'] === 'number'
              ? Math.max(0, Math.round(rawProjectRelevance['relevantProjects']))
              : 0,
          relevanceScore:
            typeof rawProjectRelevance['relevanceScore'] === 'number'
              ? Math.max(
                  0,
                  Math.min(
                    100,
                    Math.round(rawProjectRelevance['relevanceScore']),
                  ),
                )
              : 0,
          highlights: this.normalizeStringArray(
            rawProjectRelevance['highlights'],
            3,
          ),
        },
      },
      warnings: Array.isArray(src['warnings'])
        ? (src['warnings'] as unknown[]).filter((w) => typeof w === 'string')
        : [],
    };
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
    deadline: number,
  ): Promise<unknown> {
    const repairPrompt = [
      'Fix this to valid JSON only. Keep original keys and values.',
      rawModelText,
    ].join('\n');
    const repaired = await client.generateText(
      repairPrompt,
      Math.min(REPAIR_TIMEOUT_CAP_MS, this.readRemainingTimeMs(deadline)),
    );
    return this.extractJson(repaired);
  }

  private readNormalizationTimeoutMs(): number {
    const raw = Number(process.env['AI_NORMALIZATION_TIMEOUT_MS']);
    if (!Number.isFinite(raw) || raw <= 0) {
      return MAX_NORMALIZATION_TIMEOUT_MS;
    }
    return Math.min(Math.floor(raw), MAX_NORMALIZATION_TIMEOUT_MS);
  }

  private readRemainingTimeMs(deadline: number): number {
    const remainingMs = deadline - Date.now();
    if (remainingMs > 0) {
      return remainingMs;
    }

    throw new AiNormalizationError(
      'service_unavailable',
      'AI normalization timed out',
      {
        category: 'timeout',
        statusCode: 408,
        providerCode: 'NORMALIZATION_TIMEOUT',
        reason: 'AI normalization timed out',
        retryable: true,
      },
    );
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
