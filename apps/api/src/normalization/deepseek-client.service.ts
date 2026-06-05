import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { LlmClient } from './llm-client.interface';

@Injectable()
export class DeepseekClientService implements LlmClient {
  readonly provider = 'deepseek' as const;

  getModelName(): string {
    // Sử dụng deepseek-reasoner (DeepSeek-R1) cho chất lượng tốt nhất
    // hoặc deepseek-chat (V3) nếu cần tốc độ/giá rẻ.
    return process.env['DEEPSEEK_MODEL'] ?? 'deepseek-reasoner';
  }

  private getBaseUrl(): string {
    return process.env['DEEPSEEK_BASE_URL'] ?? 'https://api.deepseek.com';
  }

  async generateText(prompt: string, timeoutMs = 60000): Promise<string> {
    const apiKey = process.env['DEEPSEEK_API_KEY']?.trim();
    if (!apiKey) {
      throw new Error('DEEPSEEK_API_KEY is required');
    }

    const client = new OpenAI({
      apiKey,
      baseURL: this.getBaseUrl(),
      timeout: timeoutMs,
    });

    const response = await client.chat.completions.create({
      model: this.getModelName(),
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      stream: false,
    });
    const text = response.choices[0]?.message?.content?.trim() ?? '';

    if (!text) {
      throw new Error('DeepSeek returned an empty response');
    }

    return text;
  }
}
