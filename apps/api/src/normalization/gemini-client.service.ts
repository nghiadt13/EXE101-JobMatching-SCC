import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { LlmClient } from './llm-client.interface';

@Injectable()
export class GeminiClientService implements LlmClient {
  readonly provider = 'gemini' as const;

  getModelName(): string {
    return process.env['GEMINI_MODEL'] ?? 'gemini-3.1-flash-lite-preview';
  }

  async generateText(prompt: string, timeoutMs = 45000): Promise<string> {
    const apiKey = process.env['GEMINI_API_KEY'];
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is required');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: this.getModelName() });

    return this.withTimeout(
      model
        .generateContent(prompt)
        .then((result) => result.response.text().trim()),
      timeoutMs,
    );
  }

  private withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      promise
        .then((value) => resolve(value))
        .catch((error: unknown) => {
          reject(error instanceof Error ? error : new Error(String(error)));
        })
        .finally(() => clearTimeout(timeout));
    });
  }
}
