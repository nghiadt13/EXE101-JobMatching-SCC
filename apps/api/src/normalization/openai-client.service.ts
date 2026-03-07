import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { LlmClient } from './llm-client.interface';

@Injectable()
export class OpenAiClientService implements LlmClient {
  readonly provider = 'openai' as const;

  getModelName(): string {
    return process.env['OPENAI_MODEL'] ?? 'gpt-4.1-mini';
  }

  async generateText(prompt: string, timeoutMs = 60000): Promise<string> {
    const apiKey = process.env['OPENAI_API_KEY'];
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is required');
    }

    const client = new OpenAI({
      apiKey,
      timeout: timeoutMs,
    });
    const response = await client.responses.create({
      model: this.getModelName(),
      input: prompt,
    });
    const text = response.output_text.trim();

    if (!text) {
      throw new Error('OpenAI returned an empty response');
    }

    return text;
  }
}
