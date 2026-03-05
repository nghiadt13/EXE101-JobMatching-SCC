import { SkillsCalculatorService } from './skills-calculator.service';

describe('SkillsCalculatorService', () => {
  const service = new SkillsCalculatorService();

  it('calculates overlap ratio based on job skills', () => {
    const score = service.calculateSkillsScore(
      ['TypeScript', 'NestJS', 'PostgreSQL'],
      ['typescript', 'nestjs', 'docker'],
    );
    expect(score).toBeCloseTo(0.6667, 4);
  });

  it('returns 0 when job skills is empty', () => {
    expect(service.calculateSkillsScore(['TypeScript'], [])).toBe(0);
  });

  it('builds matched and missing breakdown', () => {
    const breakdown = service.calculateBreakdown(
      ['TypeScript', 'Node.js', 'Docker'],
      ['TypeScript', 'GraphQL', 'Docker', 'TypeScript'],
    );

    expect(breakdown.matchedSkills).toEqual(['TypeScript', 'Docker']);
    expect(breakdown.missingSkills).toEqual(['GraphQL']);
  });
});
