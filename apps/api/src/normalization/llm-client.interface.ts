import { NormalizationProvider } from './normalization.types';

export interface LlmClient {
  readonly provider: NormalizationProvider;
  getModelName(): string;
  generateText(prompt: string, timeoutMs?: number): Promise<string>;
}
