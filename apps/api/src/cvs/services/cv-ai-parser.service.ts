import { Injectable, Logger } from '@nestjs/common';
import { AiNormalizationService } from '../../normalization/ai-normalization.service';

@Injectable()
export class CvAiParserService {
  private readonly logger = new Logger(CvAiParserService.name);

  constructor(
    private readonly aiNormalizationService: AiNormalizationService,
  ) {}

  async parse(rawText: string): Promise<unknown> {
    try {
      const result = await this.aiNormalizationService.normalizeCv(rawText);
      return {
        skills: result.profile.skills,
        experience: result.profile.experience,
        education: result.profile.education,
        contact: {
          languages: result.profile.languages,
          location: result.profile.location,
        },
        candidateName: result.profile.candidateName,
        summary: result.profile.summary,
        normalizedProfile: result.profile,
        parseStatus: result.status,
        parseTelemetry: result.telemetry,
      };
    } catch (error) {
      this.logger.warn(
        `CV AI parse failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }
}
