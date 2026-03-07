import { AiNormalizationService } from './ai-normalization.service';
import { AiNormalizationError } from './normalization.errors';
import { AppLogger } from '../common/logging/app-logger.service';
import { GeminiClientService } from './gemini-client.service';
import { OpenAiClientService } from './openai-client.service';

describe('AiNormalizationService', () => {
  let service: AiNormalizationService;
  let geminiClient: {
    provider: 'gemini';
    generateText: jest.Mock;
    getModelName: jest.Mock;
  };
  let openAiClient: {
    provider: 'openai';
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
    openAiClient = {
      provider: 'openai',
      generateText: jest.fn(),
      getModelName: jest.fn().mockReturnValue('gpt-4.1-mini'),
    };
    logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };
    service = new AiNormalizationService(
      logger as unknown as AppLogger,
      geminiClient as unknown as GeminiClientService,
      openAiClient as unknown as OpenAiClientService,
    );
    process.env.GEMINI_API_KEY = 'test-key';
    delete process.env.LLM_PROVIDER;
  });

  afterEach(() => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.LLM_PROVIDER;
  });

  it('repairs malformed LLM output into a normalized profile', async () => {
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

  it('uses the OpenAI client when configured', async () => {
    process.env.LLM_PROVIDER = 'openai';
    openAiClient.generateText.mockResolvedValue(
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

    expect(result.telemetry.provider).toBe('openai');
    expect(result.profile.skills).toEqual(['Docker', 'Kubernetes']);
    expect(geminiClient.generateText).not.toHaveBeenCalled();
  });

  it('classifies timeout failures with retryable details', async () => {
    geminiClient.generateText.mockRejectedValue(new Error('Timeout after 60000ms'));

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
    process.env.LLM_PROVIDER = 'openai';
    openAiClient.generateText.mockRejectedValue(
      Object.assign(new Error('Rate limit exceeded'), {
        status: 429,
        code: 'rate_limit_exceeded',
      }),
    );

    await expect(service.normalizeCv('rate limited cv text')).rejects.toMatchObject({
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
});
