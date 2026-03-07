import { SkillAtomizerService } from './skill-atomizer.service';
import { SkillCanonicalizerService } from './skill-canonicalizer.service';

describe('SkillAtomizerService', () => {
  const service = new SkillAtomizerService(new SkillCanonicalizerService());

  it('splits grouped cloud skills into atomic canonical records', () => {
    const result = service.atomizeSkills(
      ['AWS: EC2, S3, Lambda', 'Node.js/TypeScript'],
      'job_parsed',
    );

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: 'EC2',
          canonical: 'ec2',
          group: 'AWS',
        }),
        expect.objectContaining({ label: 'S3', canonical: 's3', group: 'AWS' }),
        expect.objectContaining({
          label: 'Lambda',
          canonical: 'lambda',
          group: 'AWS',
        }),
        expect.objectContaining({
          label: 'Node.js',
          canonical: 'nodejs',
          group: null,
        }),
        expect.objectContaining({
          label: 'TypeScript',
          canonical: 'typescript',
          group: null,
        }),
      ]),
    );
  });

  it('deduplicates aliases to one canonical skill', () => {
    const result = service.atomizeSkills(
      ['Postgres', 'PostgreSQL', 'ReactJS', 'React'],
      'cv_manual',
    );

    expect(
      result.filter((entry) => entry.canonical === 'postgresql'),
    ).toHaveLength(1);
    expect(result.filter((entry) => entry.canonical === 'react')).toHaveLength(
      1,
    );
  });

  it('preserves group semantics for single-item grouped skills', () => {
    const result = service.atomizeSkills(
      ['AWS: EC2', 'Frontend: React'],
      'job_parsed',
    );

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: 'EC2',
          canonical: 'ec2',
          group: 'AWS',
        }),
        expect.objectContaining({
          label: 'React',
          canonical: 'react',
          group: 'Frontend',
        }),
      ]),
    );
  });
});
