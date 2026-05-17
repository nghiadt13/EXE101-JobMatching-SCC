import { Global, Module } from '@nestjs/common';
import { AiNormalizationService } from './ai-normalization.service';
import { GeminiClientService } from './gemini-client.service';
import { KimiClientService } from './kimi-client.service';

@Global()
@Module({
  providers: [GeminiClientService, KimiClientService, AiNormalizationService],
  exports: [AiNormalizationService, GeminiClientService, KimiClientService],
})
export class NormalizationModule {}
