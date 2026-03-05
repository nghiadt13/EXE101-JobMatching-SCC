import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class CvAiParserService {
  private readonly logger = new Logger(CvAiParserService.name);

  async parse(rawText: string): Promise<unknown> {
    const apiKey = process.env['GEMINI_API_KEY'];
    if (!apiKey) {
      return this.fallbackParse(rawText);
    }

    try {
      const modelName = process.env['GEMINI_MODEL'] ?? 'gemini-1.5-flash';
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: modelName });
      const prompt = this.buildPrompt(rawText);

      const responseText = await this.withTimeout(
        model
          .generateContent(prompt)
          .then((result) => result.response.text().trim()),
        12000,
      );

      const parsed = this.extractJson(responseText);
      if (parsed) {
        return parsed;
      }
    } catch (error) {
      this.logger.warn(
        `Gemini parse failed, fallback parser in use: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }

    return this.fallbackParse(rawText);
  }

  private buildPrompt(rawText: string): string {
    return [
      'Extract CV data and return strict JSON only.',
      'No markdown. No explanation.',
      'JSON shape:',
      '{"skills": string[], "experience": object[], "education": object[], "contact": object, "summary": string}',
      'If field is unknown return empty array/object/string.',
      '',
      `CV text: ${rawText}`,
    ].join('\n');
  }

  private extractJson(text: string): Record<string, unknown> | null {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      return null;
    }

    try {
      return JSON.parse(match[0]) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  private fallbackParse(rawText: string): Record<string, unknown> {
    const normalized = rawText.toLowerCase();
    const skillDictionary = [
      'javascript',
      'typescript',
      'node',
      'nestjs',
      'react',
      'next.js',
      'nextjs',
      'python',
      'django',
      'java',
      'spring',
      'sql',
      'postgresql',
      'mysql',
      'docker',
      'kubernetes',
      'aws',
      'gcp',
      'azure',
      'git',
      'html',
      'css',
    ];

    const skills = skillDictionary.filter((skill) =>
      normalized.includes(skill),
    );
    return {
      skills,
      experience: [],
      education: [],
      contact: {},
      summary: rawText.slice(0, 600),
    };
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
