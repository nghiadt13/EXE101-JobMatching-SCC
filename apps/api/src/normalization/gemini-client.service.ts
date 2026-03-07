import { Injectable } from '@nestjs/common';
import { LlmClient } from './llm-client.interface';

@Injectable()
export class GeminiClientService implements LlmClient {
  readonly provider = 'gemini' as const;

  getModelName(): string {
    return process.env['GEMINI_MODEL'] ?? 'gemini-3.1-flash-lite-preview';
  }

  async generateText(prompt: string, timeoutMs = 60000): Promise<string> {
    const apiKey = process.env['GEMINI_API_KEY'];
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is required');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const model = this.getModelName();

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
          }),
          signal: controller.signal,
        },
      );

      const payload = (await response.json()) as Record<string, unknown>;
      const providerError = this.asRecord(payload['error']) ?? {};

      if (!response.ok) {
        throw Object.assign(
          new Error(
            this.readString(providerError['message']) ||
              `Gemini request failed with status ${response.status}`,
          ),
          {
            status: response.status,
            code:
              this.readString(providerError['status']) ||
              this.readString(providerError['code']) ||
              null,
          },
        );
      }

      const text = this.extractText(payload).trim();
      if (!text) {
        throw new Error('Gemini returned an empty response');
      }

      return text;
    } catch (error) {
      if (
        error instanceof Error &&
        (error.name === 'AbortError' || controller.signal.aborted)
      ) {
        throw new Error(`Timeout after ${timeoutMs}ms`);
      }
      throw error instanceof Error ? error : new Error(String(error));
    } finally {
      clearTimeout(timeout);
    }
  }

  private extractText(payload: Record<string, unknown>): string {
    const candidates = Array.isArray(payload['candidates'])
      ? payload['candidates']
      : [];
    const first = this.asRecord(candidates[0]);
    const content = this.asRecord(first?.['content']);
    const parts = Array.isArray(content?.['parts']) ? content['parts'] : [];

    return parts
      .map((part) => this.readString(this.asRecord(part)?.['text']))
      .filter(Boolean)
      .join(' ');
  }

  private asRecord(value: unknown): Record<string, unknown> | null {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null;
  }

  private readString(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
  }
}
