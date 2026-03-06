import { Global, Module } from '@nestjs/common';
import { AiNormalizationService } from './ai-normalization.service';
import { GeminiClientService } from './gemini-client.service';

@Global()
@Module({
  providers: [GeminiClientService, AiNormalizationService],
  exports: [AiNormalizationService],
})
export class NormalizationModule {}
