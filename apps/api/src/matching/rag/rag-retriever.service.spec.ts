import { RagRetrieverService } from './rag-retriever.service';

describe('RagRetrieverService', () => {
  let service: RagRetrieverService;

  beforeEach(() => {
    service = new RagRetrieverService();
  });

  it('retrieves canonical skill aliases from JD and CV skills', () => {
    const result = service.retrieve({
      jdSkills: ['ReactJS', 'Postgres'],
      cvSkills: ['React', 'PostgreSQL'],
      maxItems: 6,
    });

    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          item: expect.objectContaining({
            kind: 'skill_alias',
            title: 'React',
          }),
        }),
        expect.objectContaining({
          item: expect.objectContaining({
            kind: 'skill_alias',
            title: 'PostgreSQL',
          }),
        }),
      ]),
    );
    expect(result.queryTerms).toEqual(
      expect.arrayContaining(['reactjs', 'react', 'postgresql']),
    );
  });

  it('retrieves related skills for framework ecosystem context', () => {
    const result = service.retrieve({
      jdSkills: ['Node.js'],
      cvSkills: ['NestJS', 'Prisma'],
      maxItems: 8,
    });

    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          item: expect.objectContaining({
            kind: 'related_skill',
            title: 'NestJS and Node.js',
          }),
        }),
        expect.objectContaining({
          item: expect.objectContaining({
            kind: 'related_skill',
            title: 'Prisma and ORM',
          }),
        }),
      ]),
    );
  });

  it('retrieves role expectation context from JD text', () => {
    const result = service.retrieve({
      jdText:
        'We are hiring a Senior backend engineer to lead architecture and mentor junior developers.',
      maxItems: 5,
    });

    expect(result.items[0]).toEqual(
      expect.objectContaining({
        item: expect.objectContaining({
          kind: 'role_expectation',
          title: 'Senior engineer expectations',
        }),
      }),
    );
  });

  it('retrieves domain and certification hints without treating them as evidence', () => {
    const result = service.retrieve({
      jdText:
        'Cloud engineer role requiring AWS certification and healthcare data compliance experience.',
      cvText: 'Built services on Amazon Web Services for hospital analytics.',
      maxItems: 8,
    });

    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          item: expect.objectContaining({
            kind: 'domain_hint',
            title: 'AWS certification',
          }),
        }),
        expect.objectContaining({
          item: expect.objectContaining({
            kind: 'domain_hint',
            title: 'Healthcare domain',
          }),
        }),
      ]),
    );
  });

  it('handles empty input safely', () => {
    const result = service.retrieve({});

    expect(result.items).toEqual([]);
    expect(result.queryTerms).toEqual([]);
    expect(result.warnings).toContain('No query terms available for RAG retrieval.');
  });

  it('ranks stronger overlapping items before weaker matches', () => {
    const result = service.retrieve({
      jdSkills: ['React', 'Next.js', 'TypeScript'],
      jdText: 'Frontend role requiring React, Next.js, and TypeScript.',
      maxItems: 5,
    });

    expect(result.items[0].item.kind).toBe('skill_alias');
    expect(['React', 'Next.js', 'TypeScript']).toContain(result.items[0].item.title);
    expect(result.items[0].score).toBeGreaterThanOrEqual(
      result.items[result.items.length - 1].score,
    );
    expect(result.items[0].reason).toContain('Matched');
  });
});
