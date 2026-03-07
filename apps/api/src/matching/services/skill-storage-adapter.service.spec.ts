import { SkillAtomizerService } from './skill-atomizer.service';
import { SkillCanonicalizerService } from './skill-canonicalizer.service';
import { SkillStorageAdapterService } from './skill-storage-adapter.service';

describe('SkillStorageAdapterService', () => {
  const service = new SkillStorageAdapterService(
    new SkillAtomizerService(new SkillCanonicalizerService()),
  );

  it('writes display skills and canonical atoms together', () => {
    const result = service.toStoredSkills(
      ['AWS: EC2, S3, Lambda', 'Postgres'],
      'job_parsed',
    );

    expect(result.skills).toEqual(['AWS: EC2, S3, Lambda', 'Postgres']);
    expect(result.skillAtoms).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ canonical: 'ec2' }),
        expect.objectContaining({ canonical: 's3' }),
        expect.objectContaining({ canonical: 'lambda' }),
        expect.objectContaining({ canonical: 'postgresql' }),
      ]),
    );
  });

  it('reads valid skill atoms from prisma json payloads', () => {
    const result = service.readSkillAtoms([
      {
        raw: 'Node.js',
        label: 'Node.js',
        canonical: 'nodejs',
        group: null,
        source: 'cv_manual',
      },
      {
        raw: '',
        label: '',
        canonical: '',
        group: null,
        source: 'legacy',
      },
    ]);

    expect(result).toEqual([
      {
        raw: 'Node.js',
        label: 'Node.js',
        canonical: 'nodejs',
        group: null,
        source: 'cv_manual',
      },
    ]);
  });

  it('derives atoms from legacy grouped skills for fallback reads', () => {
    const result = service.deriveFromLegacySkills(['Node.js/TypeScript']);

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ canonical: 'nodejs' }),
        expect.objectContaining({ canonical: 'typescript' }),
      ]),
    );
  });

  it('normalizes fallback node skill to nodejs', () => {
    const result = service.deriveFromLegacySkills(['node']);

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ canonical: 'nodejs' }),
      ]),
    );
  });
});
