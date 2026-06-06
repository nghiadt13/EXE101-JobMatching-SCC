import { NormalizationProvider } from './normalization.types';

export interface LlmClient {
  readonly provider: NormalizationProvider;
  getModelName(tier?: 'fast' | 'pro'): string;
  generateText(
    prompt: string,
    timeoutMs?: number,
    tier?: 'fast' | 'pro',
  ): Promise<string>;
  generateEmbedding?(text: string): Promise<number[]>;
}
