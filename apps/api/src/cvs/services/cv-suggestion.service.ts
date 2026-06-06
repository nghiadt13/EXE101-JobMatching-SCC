import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { AppLogger } from '../../common/logging/app-logger.service';
import { GeminiClientService } from '../../normalization/gemini-client.service';
import { KimiClientService } from '../../normalization/kimi-client.service';
import { DeepseekClientService } from '../../normalization/deepseek-client.service';
import { LlmClient } from '../../normalization/llm-client.interface';
import { classifyLlmError } from '../../normalization/llm-error-classifier';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CvSuggestion,
  SectionSuggestion,
  RewriteSuggestion,
} from '../cv-suggestion.types';

const SUGGESTION_TIMEOUT_MS = 60_000;

@Injectable()
export class CvSuggestionService {
  constructor(
    private readonly logger: AppLogger,
    private readonly prisma: PrismaService,
    private readonly geminiClient: GeminiClientService,
    private readonly kimiClient: KimiClientService,
    private readonly deepseekClient: DeepseekClientService,
  ) {}

  async suggest(
    userId: string,
    cvId: string,
    jobId: string,
  ): Promise<CvSuggestion> {
    const start = Date.now();
    const client = this.resolveClient();

    // 1. Load CV (check ownership, get rawText)
    const candidate = await this.prisma.candidate.findFirst({
      where: { userId, user: { deletedAt: null } },
      select: { id: true },
    });
    if (!candidate) {
      throw new NotFoundException('Candidate profile not found');
    }

    const cv = await this.prisma.cV.findFirst({
      where: { id: cvId, candidateId: candidate.id, deletedAt: null },
      select: { rawText: true },
    });
    if (!cv) {
      throw new NotFoundException('CV not found');
    }
    if (!cv.rawText || cv.rawText.trim().length === 0) {
      throw new UnprocessableEntityException(
        'CV has no text content for analysis',
      );
    }

    // 2. Load Job (check PUBLISHED, get requirementsSchema + description)
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, status: 'PUBLISHED' },
      select: {
        title: true,
        description: true,
        skills: true,
        requirementsSchema: true,
      },
    });
    if (!job) {
      throw new NotFoundException('Job not found or not published');
    }

    // 3. Build prompt
    const prompt = this.buildSuggestionPrompt(
      cv.rawText,
      job.title,
      job.description,
      job.skills as string[],
      job.requirementsSchema as Record<string, unknown> | null,
    );

    // 4. Call LLM
    try {
      const rawResponse = await client.generateText(
        prompt,
        SUGGESTION_TIMEOUT_MS,
        'pro',
      );

      // 5. Parse + normalize
      const suggestion = this.parseAndNormalize(rawResponse);

      this.logger.info('cv_suggestion_completed', {
        actorId: userId,
        cvId,
        jobId,
        provider: client.provider,
        model: client.getModelName(),
        latencyMs: Date.now() - start,
        overallScore: suggestion.overallScore,
      });

      return suggestion;
    } catch (error) {
      const failure = classifyLlmError(error);
      this.logger.warn('cv_suggestion_failed', {
        actorId: userId,
        cvId,
        jobId,
        provider: client.provider,
        model: client.getModelName(),
        latencyMs: Date.now() - start,
        failureCategory: failure.category,
        reason: failure.reason,
      });

      throw new UnprocessableEntityException({
        message: 'AI suggestion failed. Please try again later.',
        code: 'AI_SUGGESTION_FAILED',
        details: {
          category: failure.category,
          retryable: failure.retryable,
        },
      });
    }
  }

  private resolveClient(): LlmClient {
    const provider = (process.env['LLM_PROVIDER'] ?? 'gemini')
      .trim()
      .toLowerCase();
    if (provider === 'kimi') return this.kimiClient;
    if (provider === 'deepseek') return this.deepseekClient;
    return this.geminiClient;
  }

  private buildSuggestionPrompt(
    cvRawText: string,
    jobTitle: string,
    jobDescription: string,
    jobSkills: string[],
    requirementsSchema: Record<string, unknown> | null,
  ): string {
    const outputTemplate: CvSuggestion = {
      overallScore: 72,
      missingKeywords: ['Docker', 'Kubernetes'],
      strengthHighlights: ['Strong background in X'],
      sections: [
        {
          section: 'summary',
          suggestions: ['Add keyword Y'],
          priority: 'high',
        },
      ],
      rewriteSuggestions: [
        {
          section: 'summary',
          original: 'Original text...',
          suggested: 'Improved text...',
          reason: 'Because JD requires...',
        },
      ],
    };

    const lines = [
      'You are an expert Career Coach AI. Given a CV and a Job Description, analyze how well the CV matches the JD and provide actionable improvement suggestions.',
      '',
      `## Job Title: ${jobTitle}`,
      '',
      '## Job Description',
      '--- START OF JD ---',
      jobDescription,
      '--- END OF JD ---',
      '',
    ];

    if (jobSkills.length > 0) {
      lines.push(`## Required Skills: ${jobSkills.join(', ')}`, '');
    }

    if (requirementsSchema) {
      lines.push(
        '## Structured Requirements',
        JSON.stringify(requirementsSchema, null, 2),
        '',
      );
    }

    lines.push(
      '## Candidate CV',
      '--- START OF CV ---',
      cvRawText,
      '--- END OF CV ---',
      '',
      '## Instructions',
      '1. overallScore: 0-100 score of how well the CV matches this specific JD.',
      '2. missingKeywords: List exact skills/technologies/keywords from the JD that are NOT mentioned in the CV. Maximum 10 keywords.',
      '3. strengthHighlights: 2-4 things the CV already does well for this JD.',
      '4. sections: For each CV section (summary, skills, experience, education, projects, certifications), provide specific suggestions. Include a priority (high/medium/low). Only include sections that need improvement.',
      '5. rewriteSuggestions: For 1-3 key phrases in the CV, provide a "before/after" rewrite suggestion that better aligns with the JD. The "original" must be an actual phrase from the CV. The "suggested" should be an improved version. Include a "reason" explaining why.',
      '',
      '## Language',
      'Write suggestions in the SAME language as the CV (if the CV is in Vietnamese, write suggestions in Vietnamese; if in English, write in English).',
      '',
      '## Output Format',
      'Return STRICT JSON ONLY. No markdown, no preamble, no code fences. Match this exact structure:',
      JSON.stringify(outputTemplate, null, 2),
    );

    return lines.join('\n');
  }

  private parseAndNormalize(rawResponse: string): CvSuggestion {
    const parsed = this.extractJson(rawResponse);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('AI returned invalid JSON for CV suggestion');
    }

    const src = parsed as Record<string, unknown>;

    return {
      overallScore: this.normalizeScore(src['overallScore']),
      missingKeywords: this.normalizeStringArray(src['missingKeywords'], 10),
      strengthHighlights: this.normalizeStringArray(
        src['strengthHighlights'],
        5,
      ),
      sections: this.normalizeSections(src['sections']),
      rewriteSuggestions: this.normalizeRewrites(src['rewriteSuggestions']),
    };
  }

  private extractJson(text: string): unknown {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]) as unknown;
    } catch {
      return null;
    }
  }

  private normalizeScore(value: unknown): number {
    if (typeof value !== 'number' || Number.isNaN(value)) return 0;
    return Math.max(0, Math.min(100, Math.round(value)));
  }

  private normalizeStringArray(value: unknown, max: number): string[] {
    if (!Array.isArray(value)) return [];
    return value
      .filter(
        (item): item is string =>
          typeof item === 'string' && item.trim() !== '',
      )
      .map((s) => s.trim())
      .slice(0, max);
  }

  private normalizeSections(value: unknown): SectionSuggestion[] {
    if (!Array.isArray(value)) return [];
    const validPriorities = new Set(['high', 'medium', 'low']);
    return value
      .map((item) => {
        if (!item || typeof item !== 'object' || Array.isArray(item))
          return null;
        const rec = item as Record<string, unknown>;
        const section =
          typeof rec['section'] === 'string' ? rec['section'].trim() : '';
        if (!section) return null;
        return {
          section,
          suggestions: this.normalizeStringArray(rec['suggestions'], 5),
          priority: validPriorities.has(String(rec['priority']))
            ? (String(rec['priority']) as 'high' | 'medium' | 'low')
            : 'medium',
        };
      })
      .filter(
        (s): s is SectionSuggestion => s !== null && s.suggestions.length > 0,
      )
      .slice(0, 8);
  }

  private normalizeRewrites(value: unknown): RewriteSuggestion[] {
    if (!Array.isArray(value)) return [];
    return value
      .map((item) => {
        if (!item || typeof item !== 'object' || Array.isArray(item))
          return null;
        const rec = item as Record<string, unknown>;
        const section =
          typeof rec['section'] === 'string' ? rec['section'].trim() : '';
        const original =
          typeof rec['original'] === 'string' ? rec['original'].trim() : '';
        const suggested =
          typeof rec['suggested'] === 'string' ? rec['suggested'].trim() : '';
        const reason =
          typeof rec['reason'] === 'string' ? rec['reason'].trim() : '';
        if (!section || !original || !suggested) return null;
        return { section, original, suggested, reason };
      })
      .filter((r): r is RewriteSuggestion => r !== null)
      .slice(0, 3);
  }
}
