import { TfidfCalculatorService } from './tfidf-calculator.service';

describe('TfidfCalculatorService', () => {
  const service = new TfidfCalculatorService();

  it('returns 0 when either side is empty', () => {
    expect(service.calculateTfidfScore('', 'backend engineer')).toBe(0);
    expect(service.calculateTfidfScore('typescript nestjs', '')).toBe(0);
  });

  it('returns a bounded score for similar texts', () => {
    const score = service.calculateTfidfScore(
      'typescript nestjs postgres docker',
      'looking for nestjs typescript backend engineer',
    );
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  it('is deterministic for same input', () => {
    const one = service.calculateTfidfScore(
      'python django postgresql',
      'django backend postgresql',
    );
    const two = service.calculateTfidfScore(
      'python django postgresql',
      'django backend postgresql',
    );
    expect(one).toBe(two);
  });
});
