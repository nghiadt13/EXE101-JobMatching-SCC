import { Injectable } from '@nestjs/common';
import { cosineSimilarity } from '../utils/cosine-similarity';
import { normalizeText } from '../utils/text-normalizer';

@Injectable()
export class TfidfCalculatorService {
  calculateTfidfScore(cvText: string, jobText: string): number {
    const normalizedCvText = normalizeText(cvText);
    const normalizedJobText = normalizeText(jobText);
    if (!normalizedCvText || !normalizedJobText) {
      return 0;
    }

    const cvTokens = normalizedCvText.split(' ').filter(Boolean);
    const jobTokens = normalizedJobText.split(' ').filter(Boolean);
    if (cvTokens.length === 0 || jobTokens.length === 0) {
      return 0;
    }

    const cvVector = this.buildTfidfVector(cvTokens, cvTokens, jobTokens);
    const jobVector = this.buildTfidfVector(jobTokens, cvTokens, jobTokens);

    return this.clampUnit(cosineSimilarity(cvVector, jobVector));
  }

  private buildTfidfVector(
    targetTokens: string[],
    cvTokens: string[],
    jobTokens: string[],
  ): Map<string, number> {
    const targetCountMap = this.buildTokenCountMap(targetTokens);
    const cvTokenSet = new Set(cvTokens);
    const jobTokenSet = new Set(jobTokens);
    const vocabulary = new Set([...cvTokenSet, ...jobTokenSet]);
    const targetLength = Math.max(1, targetTokens.length);
    const vector = new Map<string, number>();

    for (const token of vocabulary) {
      const termCount = targetCountMap.get(token) ?? 0;
      if (termCount === 0) {
        continue;
      }
      const tf = termCount / targetLength;
      const documentFrequency =
        Number(cvTokenSet.has(token)) + Number(jobTokenSet.has(token));
      const idf = Math.log((2 + 1) / (documentFrequency + 1)) + 1;
      vector.set(token, tf * idf);
    }

    return vector;
  }

  private buildTokenCountMap(tokens: string[]): Map<string, number> {
    const map = new Map<string, number>();
    for (const token of tokens) {
      map.set(token, (map.get(token) ?? 0) + 1);
    }
    return map;
  }

  private clampUnit(score: number): number {
    if (!Number.isFinite(score)) {
      return 0;
    }
    if (score < 0) {
      return 0;
    }
    if (score > 1) {
      return 1;
    }
    return Number(score.toFixed(4));
  }
}
