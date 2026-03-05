import { CvParsingNormalizerService } from './cv-parsing-normalizer.service';

describe('CvParsingNormalizerService', () => {
  let service: CvParsingNormalizerService;

  beforeEach(() => {
    service = new CvParsingNormalizerService();
  });

  it('normalizes malformed payload to stable schema', () => {
    const normalized = service.normalize(
      {
        skills: ['TypeScript', ' TypeScript ', '', 123],
        experience: [{ company: 'A' }, null, 'text'],
        education: [{ school: 'B' }],
        contact: { email: 'candidate@example.com' },
      },
      'raw cv text',
    );

    expect(normalized.skills).toEqual(['TypeScript']);
    expect(normalized.parsedData.experience).toHaveLength(1);
    expect(normalized.parsedData.education).toHaveLength(1);
    expect(normalized.parsedData.contact).toMatchObject({
      email: 'candidate@example.com',
    });
  });

  it('falls back summary from raw text when missing', () => {
    const normalized = service.normalize({}, 'candidate summary text');
    expect(normalized.parsedData.summary).toContain('candidate summary text');
  });
});
