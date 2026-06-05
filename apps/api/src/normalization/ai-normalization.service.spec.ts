import { AiNormalizationService } from './ai-normalization.service';
import { AiNormalizationError } from './normalization.errors';
import { AppLogger } from '../common/logging/app-logger.service';
import { DeepseekClientService } from './deepseek-client.service';
import { GeminiClientService } from './gemini-client.service';
import { KimiClientService } from './kimi-client.service';
import {
  JD_CONTEXTUAL_EVAL_V1,
  REQUIREMENTS_SCHEMA_V2,
  RequirementsSchemaV2,
} from '../matching/types/schema-matching.types';

describe('AiNormalizationService', () => {
  let service: AiNormalizationService;
  let geminiClient: {
    provider: 'gemini';
    generateText: jest.Mock;
    getModelName: jest.Mock;
  };
  let kimiClient: {
    provider: 'kimi';
    generateText: jest.Mock;
    getModelName: jest.Mock;
  };
  let deepseekClient: {
    provider: 'deepseek';
    generateText: jest.Mock;
    getModelName: jest.Mock;
  };
  let logger: {
    info: jest.Mock;
    warn: jest.Mock;
    error: jest.Mock;
  };

  beforeEach(() => {
    geminiClient = {
      provider: 'gemini',
      generateText: jest.fn(),
      getModelName: jest.fn().mockReturnValue('gemini-3.1-flash-lite-preview'),
    };
    kimiClient = {
      provider: 'kimi',
      generateText: jest.fn(),
      getModelName: jest.fn().mockReturnValue('kimi-k2.5'),
    };
    deepseekClient = {
      provider: 'deepseek',
      generateText: jest.fn(),
      getModelName: jest.fn().mockReturnValue('deepseek-v4-flash'),
    };
    logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };
    service = new AiNormalizationService(
      logger as unknown as AppLogger,
      geminiClient as unknown as GeminiClientService,
      kimiClient as unknown as KimiClientService,
      deepseekClient as unknown as DeepseekClientService,
      {
        jobCategory: {
          findMany: jest.fn().mockResolvedValue([]),
        },
      } as any,
    );
    process.env.GEMINI_API_KEY = 'test-key';
    delete process.env.LLM_PROVIDER;
    delete process.env.LLM_FALLBACK_PROVIDER;
    delete process.env.CV_PARSE_LLM_PROVIDER;
  });

  afterEach(() => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.LLM_PROVIDER;
    delete process.env.LLM_FALLBACK_PROVIDER;
    delete process.env.CV_PARSE_LLM_PROVIDER;
  });

  it('uses DeepSeek fast by default for CV normalization', async () => {
    deepseekClient.generateText.mockResolvedValue(
      JSON.stringify({
        schemaVersion: 'candidate_job_profile_v1',
        language: 'en',
        title: 'Backend Engineer',
        summary: 'Build APIs',
        skills: ['TypeScript', 'Node.js'],
        experience: [],
        education: [],
        certifications: [],
        projects: [],
        languages: ['English'],
        location: { city: 'Hanoi', country: 'Vietnam' },
        rawQuality: {
          score: 82,
          needsManualReview: false,
          reason: '',
        },
      }),
    );

    const result = await service.normalizeCv('TypeScript Node.js engineer');

    expect(deepseekClient.generateText).toHaveBeenCalledTimes(1);
    expect(deepseekClient.getModelName).toHaveBeenCalledWith();
    expect(result.telemetry.provider).toBe('deepseek');
    expect(result.telemetry.model).toBe('deepseek-v4-flash');
    expect(result.profile.skills).toEqual(['TypeScript', 'Node.js']);
    expect(geminiClient.generateText).not.toHaveBeenCalled();
  });

  it('repairs malformed CV LLM output using the configured CV parse provider', async () => {
    process.env.CV_PARSE_LLM_PROVIDER = 'gemini';
    geminiClient.generateText
      .mockResolvedValueOnce('not valid json')
      .mockResolvedValueOnce(
        JSON.stringify({
          schemaVersion: 'candidate_job_profile_v1',
          language: 'en',
          title: 'Backend Engineer',
          summary: 'Build APIs',
          skills: ['TypeScript', 'Node.js'],
          experience: [],
          education: [],
          certifications: [],
          projects: [],
          languages: ['English'],
          location: { city: 'Hanoi', country: 'Vietnam' },
          rawQuality: {
            score: 82,
            needsManualReview: false,
            reason: '',
          },
        }),
      );

    const result = await service.normalizeCv('TypeScript Node.js engineer');

    expect(geminiClient.generateText).toHaveBeenCalledTimes(2);
    expect(result.telemetry.provider).toBe('gemini');
    expect(result.profile.skills).toEqual(['TypeScript', 'Node.js']);
    expect(result.status).toBe('parsed_ok');
  });

  it('throws when malformed JSON cannot be repaired', async () => {
    geminiClient.generateText
      .mockResolvedValueOnce('still invalid')
      .mockResolvedValueOnce('still invalid');

    await expect(
      service.normalizeJob('AWS and Docker role'),
    ).rejects.toBeInstanceOf(AiNormalizationError);
  });

  it('uses the Kimi client for CV normalization when configured', async () => {
    process.env.CV_PARSE_LLM_PROVIDER = 'kimi';
    kimiClient.generateText.mockResolvedValue(
      JSON.stringify({
        schemaVersion: 'candidate_job_profile_v1',
        language: 'en',
        title: 'Platform Engineer',
        summary: 'Owns platform systems',
        skills: ['Docker', 'Kubernetes'],
        experience: [],
        education: [],
        certifications: [],
        projects: [],
        languages: ['English'],
        location: { city: 'Hanoi', country: 'Vietnam' },
        rawQuality: {
          score: 81,
          needsManualReview: false,
          reason: '',
        },
      }),
    );

    const result = await service.normalizeCv(
      'Docker Kubernetes platform engineer',
    );

    expect(result.telemetry.provider).toBe('kimi');
    expect(result.profile.skills).toEqual(['Docker', 'Kubernetes']);
    expect(geminiClient.generateText).not.toHaveBeenCalled();
  });

  it('uses the DeepSeek client when configured', async () => {
    process.env.CV_PARSE_LLM_PROVIDER = 'deepseek';
    deepseekClient.generateText.mockResolvedValue(
      JSON.stringify({
        schemaVersion: 'candidate_job_profile_v1',
        language: 'en',
        title: 'ML Engineer',
        summary: 'Builds model pipelines',
        skills: ['Python', 'Machine Learning'],
        experience: [],
        education: [],
        certifications: [],
        projects: [],
        languages: ['English'],
        location: { city: 'Hanoi', country: 'Vietnam' },
        rawQuality: {
          score: 84,
          needsManualReview: false,
          reason: '',
        },
      }),
    );

    const result = await service.normalizeCv('Python ML engineer');

    expect(result.telemetry.provider).toBe('deepseek');
    expect(result.profile.skills).toEqual(['Python', 'Machine Learning']);
    expect(geminiClient.generateText).not.toHaveBeenCalled();
  });

  it('falls back to DeepSeek when the primary provider fails', async () => {
    process.env.CV_PARSE_LLM_PROVIDER = 'gemini';
    process.env.LLM_FALLBACK_PROVIDER = 'deepseek';
    geminiClient.generateText.mockRejectedValue(new Error('quota exceeded'));
    deepseekClient.generateText.mockResolvedValue(
      JSON.stringify({
        schemaVersion: 'candidate_job_profile_v1',
        language: 'en',
        title: 'Data Engineer',
        summary: 'Builds data pipelines',
        skills: ['Python', 'Airflow'],
        experience: [],
        education: [],
        certifications: [],
        projects: [],
        languages: ['English'],
        location: { city: 'Hanoi', country: 'Vietnam' },
        rawQuality: {
          score: 88,
          needsManualReview: false,
          reason: '',
        },
      }),
    );

    const result = await service.normalizeCv('Python Airflow engineer');

    expect(result.telemetry.provider).toBe('deepseek');
    expect(geminiClient.generateText).toHaveBeenCalled();
    expect(deepseekClient.generateText).toHaveBeenCalled();
  });

  it('classifies timeout failures with retryable details', async () => {
    process.env.CV_PARSE_LLM_PROVIDER = 'gemini';
    geminiClient.generateText.mockRejectedValue(
      new Error('Timeout after 60000ms'),
    );

    await expect(service.normalizeCv('slow cv text')).rejects.toMatchObject({
      code: 'AI_SERVICE_UNAVAILABLE',
      kind: 'service_unavailable',
      details: expect.objectContaining({
        category: 'timeout',
        providerCode: null,
        retryable: true,
      }),
    });

    expect(logger.warn).toHaveBeenCalledWith(
      'ai_normalization_failed',
      expect.objectContaining({
        failureCategory: 'timeout',
        retryable: true,
      }),
    );
  });

  it('classifies 429 failures with upstream metadata', async () => {
    process.env.CV_PARSE_LLM_PROVIDER = 'kimi';
    kimiClient.generateText.mockRejectedValue(
      Object.assign(new Error('Rate limit exceeded'), {
        status: 429,
        code: 'rate_limit_exceeded',
      }),
    );

    await expect(
      service.normalizeCv('rate limited cv text'),
    ).rejects.toMatchObject({
      code: 'AI_SERVICE_UNAVAILABLE',
      kind: 'service_unavailable',
      details: expect.objectContaining({
        category: 'rate_limited',
        statusCode: 429,
        providerCode: 'rate_limit_exceeded',
        retryable: true,
      }),
    });
  });

  it('keeps confidence for exact short quote evidence and paraphrased supporting evidence', async () => {
    geminiClient.generateText.mockResolvedValue(
      JSON.stringify({
        version: JD_CONTEXTUAL_EVAL_V1,
        requirementEvaluations: [
          {
            requirementId: 'req-nest',
            status: 'met',
            evidence: ['NestJS'],
            confidence: 'high',
          },
          {
            requirementId: 'req-api',
            status: 'met',
            evidence: ['Built REST APIs with NestJS and PostgreSQL'],
            confidence: 'high',
          },
        ],
        constraintEvaluations: [],
        candidateSummary: candidateSummary(),
        warnings: [],
      }),
    );

    const result = await service.evaluateCvAgainstJd(
      [
        'Backend Engineer',
        'Built backend services using NestJS.',
        'Designed PostgreSQL schemas and REST API modules.',
      ].join('\n'),
      jdSchema(),
    );

    expect(result.requirementEvaluations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          requirementId: 'req-nest',
          confidence: 'high',
        }),
        expect.objectContaining({
          requirementId: 'req-api',
          confidence: 'high',
        }),
      ]),
    );
  });

  it('lowers confidence when evidence is not supported by CV text', async () => {
    geminiClient.generateText.mockResolvedValue(
      JSON.stringify({
        version: JD_CONTEXTUAL_EVAL_V1,
        requirementEvaluations: [
          {
            requirementId: 'req-nest',
            status: 'met',
            evidence: ['Led Kubernetes migration'],
            confidence: 'high',
          },
        ],
        constraintEvaluations: [],
        candidateSummary: candidateSummary(),
        warnings: [],
      }),
    );

    const result = await service.evaluateCvAgainstJd(
      'Backend Engineer. Built services with NestJS and PostgreSQL.',
      jdSchema({ requirements: [jdSchema().requirements[0]] }),
    );

    expect(result.requirementEvaluations[0]).toMatchObject({
      requirementId: 'req-nest',
      confidence: 'low',
    });
  });

  it('adds advisory RAG guardrails when retrieved context is provided', async () => {
    geminiClient.generateText.mockResolvedValue(
      JSON.stringify({
        version: JD_CONTEXTUAL_EVAL_V1,
        requirementEvaluations: [],
        constraintEvaluations: [],
        candidateSummary: candidateSummary(),
        warnings: [],
      }),
    );

    await service.evaluateCvAgainstJd(
      'Backend Engineer. Built services with React.',
      jdSchema({ requirements: [jdSchema().requirements[0]] }),
      'ReactJS is commonly used as an alias for React.',
    );

    const prompt = geminiClient.generateText.mock.calls[0][0] as string;

    expect(prompt).toContain('## Retrieved Context (Advisory Knowledge)');
    expect(prompt).toContain('ReactJS is commonly used as an alias for React.');
    expect(prompt).toContain(
      'Candidate evidence must still be grounded in the CV text — do not fabricate skills.',
    );
    expect(prompt).toContain(
      'Use retrieved context to make your analysis MORE insightful, not to inflate scores.',
    );
  });
});

function jdSchema(
  overrides: Partial<RequirementsSchemaV2> = {},
): RequirementsSchemaV2 {
  return {
    version: REQUIREMENTS_SCHEMA_V2,
    roleTitle: 'Backend Engineer',
    summary: 'Backend role',
    requirements: [
      {
        id: 'req-nest',
        label: 'NestJS',
        category: 'skill',
        importance: 'critical',
        keywords: ['nestjs'],
        minimumMonths: null,
      },
      {
        id: 'req-api',
        label: 'REST API development',
        category: 'skill',
        importance: 'high',
        keywords: ['rest', 'api'],
        minimumMonths: null,
      },
    ],
    constraints: [],
    locationPreference: null,
    warnings: [],
    ...overrides,
  };
}

function candidateSummary() {
  return {
    headline: 'Backend Engineer',
    totalExperienceMonths: 24,
    relevantExperienceMonths: 24,
    skills: ['NestJS', 'PostgreSQL'],
    location: null,
    projectRelevance: {
      totalProjects: 1,
      relevantProjects: 1,
      relevanceScore: 80,
      highlights: ['Backend API project'],
    },
  };
}
