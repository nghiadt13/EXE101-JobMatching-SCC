import { Global, Module } from '@nestjs/common';
import { AiNormalizationService } from './ai-normalization.service';
import { DeepseekClientService } from './deepseek-client.service';
import { GeminiClientService } from './gemini-client.service';
import { KimiClientService } from './kimi-client.service';

@Global()
@Module({
  providers: [
    GeminiClientService,
    KimiClientService,
    DeepseekClientService,
    AiNormalizationService,
  ],
  exports: [
    AiNormalizationService,
    GeminiClientService,
    KimiClientService,
    DeepseekClientService,
  ],
})
export class NormalizationModule {}
