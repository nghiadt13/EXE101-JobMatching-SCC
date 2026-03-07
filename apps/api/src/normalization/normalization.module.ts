import { Global, Module } from '@nestjs/common';
import { AiNormalizationService } from './ai-normalization.service';
import { GeminiClientService } from './gemini-client.service';
import { OpenAiClientService } from './openai-client.service';

@Global()
@Module({
  providers: [GeminiClientService, OpenAiClientService, AiNormalizationService],
  exports: [AiNormalizationService],
})
export class NormalizationModule {}
