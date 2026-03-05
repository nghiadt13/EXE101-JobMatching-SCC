import { ScoreCombinerService } from './score-combiner.service';

describe('ScoreCombinerService', () => {
  const service = new ScoreCombinerService();

  it('combines tfidf and skills using 70/30 weight', () => {
    const score = service.calculateFinalScore(0.8, 0.5);
    expect(score).toBe(71);
  });

  it('clamps invalid unit scores', () => {
    expect(service.normalizeUnit(-2)).toBe(0);
    expect(service.normalizeUnit(2)).toBe(1);
  });

  it('returns score from 0 to 100', () => {
    expect(service.calculateFinalScore(-1, -1)).toBe(0);
    expect(service.calculateFinalScore(10, 10)).toBe(100);
  });
});
