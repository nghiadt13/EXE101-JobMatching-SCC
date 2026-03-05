import { Injectable } from '@nestjs/common';

const TFIDF_WEIGHT = 0.7;
const SKILLS_WEIGHT = 0.3;

@Injectable()
export class ScoreCombinerService {
  calculateFinalScore(tfidfScore: number, skillsScore: number): number {
    const normalizedTfidf = this.clampUnit(tfidfScore);
    const normalizedSkills = this.clampUnit(skillsScore);
    const score =
      normalizedTfidf * TFIDF_WEIGHT + normalizedSkills * SKILLS_WEIGHT;
    const scorePercent = Math.round(score * 100);
    return Math.max(0, Math.min(100, scorePercent));
  }

  normalizeUnit(score: number): number {
    return this.clampUnit(score);
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
