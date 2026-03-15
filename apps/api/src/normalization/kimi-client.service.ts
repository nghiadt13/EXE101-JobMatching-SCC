import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { LlmClient } from './llm-client.interface';

@Injectable()
export class KimiClientService implements LlmClient {
  readonly provider = 'kimi' as const;

  getModelName(): string {
    return process.env['KIMI_MODEL'] ?? 'kimi-k2.5';
  }

  async generateText(prompt: string, timeoutMs = 60000): Promise<string> {
    const apiKey = process.env['KIMI_API_KEY'];
    if (!apiKey) {
      throw new Error('KIMI_API_KEY is required');
    }

    const client = new OpenAI({
      apiKey,
      baseURL: 'https://api.moonshot.cn/v1',
      timeout: timeoutMs,
    });
    const response = await client.chat.completions.create({
      model: this.getModelName(),
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    });
    const text = response.choices[0]?.message?.content?.trim() ?? '';

    if (!text) {
      throw new Error('Kimi returned an empty response');
    }

    return text;
  }
}
