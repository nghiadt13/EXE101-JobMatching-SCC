import { AiNormalizationService } from './ai-normalization.service';
import { GeminiClientService } from './gemini-client.service';

describe('AiNormalizationService', () => {
  let service: AiNormalizationService;
  let geminiClient: { generateText: jest.Mock };

  beforeEach(() => {
    geminiClient = { generateText: jest.fn() };
    service = new AiNormalizationService(
      geminiClient as unknown as GeminiClientService,
    );
    process.env.GEMINI_API_KEY = 'test-key';
  });

  afterEach(() => {
    delete process.env.GEMINI_API_KEY;
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
    expect(result.telemetry.source).toBe('llm');
    expect(result.telemetry.fallbackUsed).toBe(false);
    expect(result.profile.skills).toEqual(['TypeScript', 'Node.js']);
    expect(result.status).toBe('parsed_ok');
  });

  it('falls back when malformed JSON cannot be repaired', async () => {
    geminiClient.generateText
      .mockResolvedValueOnce('still invalid')
      .mockResolvedValueOnce('still invalid');

    const result = await service.normalizeJob('AWS and Docker role');

    expect(result.telemetry.source).toBe('fallback');
    expect(result.telemetry.fallbackUsed).toBe(true);
    expect(result.status).toBe('fallback');
    expect(result.profile.rawQuality.reason).toBe('invalid_json_from_llm');
    expect(result.profile.skills).toEqual(
      expect.arrayContaining(['docker', 'aws']),
    );
  });
});
