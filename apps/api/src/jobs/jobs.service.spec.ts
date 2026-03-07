import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { JobStatus, UserRole } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { DocumentStorageService } from '../documents/services/document-storage.service';
import { DocumentTextExtractorService } from '../documents/services/document-text-extractor.service';
import { PrismaService } from '../prisma/prisma.service';
import { AiNormalizationService } from '../normalization/ai-normalization.service';
import { JobsService } from './jobs.service';
import { JobSlugService } from './services/job-slug.service';

describe('JobsService', () => {
  let service: JobsService;
  let documentStorageService: { save: jest.Mock; remove: jest.Mock };
  let documentTextExtractorService: {
    assertSupported: jest.Mock;
    extract: jest.Mock;
  };
  let prismaService: {
    job: {
      create: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
    };
  };
  let aiNormalizationService: { normalizeJob: jest.Mock };
  let generateUniqueSlug: jest.Mock;

  const normalizedJobResult = {
    schemaVersion: 'candidate_job_profile_v1' as const,
    status: 'parsed_ok' as const,
    profile: {
      schemaVersion: 'candidate_job_profile_v1' as const,
      language: 'en' as const,
      title: 'Job',
      summary: 'Summary',
      skills: ['TypeScript'],
      experience: [],
      education: [],
      certifications: [],
      projects: [],
      languages: [],
      location: { city: '', country: '' },
      rawQuality: { score: 90, needsManualReview: false, reason: '' },
      jobMeta: {
        requirements: [],
        benefits: [],
        employmentType: 'FULL_TIME',
      },
    },
    telemetry: { source: 'llm' as const, fallbackUsed: false, latencyMs: 100 },
  };

  beforeEach(async () => {
    documentStorageService = { save: jest.fn(), remove: jest.fn() };
    documentTextExtractorService = {
      assertSupported: jest.fn(),
      extract: jest.fn(),
    };
    prismaService = {
      job: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };
    aiNormalizationService = {
      normalizeJob: jest.fn().mockResolvedValue(normalizedJobResult),
    };
    generateUniqueSlug = jest.fn().mockResolvedValue('job-1');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsService,
        { provide: PrismaService, useValue: prismaService },
        { provide: AiNormalizationService, useValue: aiNormalizationService },
        {
          provide: DocumentStorageService,
          useValue: documentStorageService,
        },
        {
          provide: DocumentTextExtractorService,
          useValue: documentTextExtractorService,
        },
        {
          provide: JobSlugService,
          useValue: {
            generateUniqueSlug,
          },
        },
      ],
    }).compile();

    service = module.get<JobsService>(JobsService);
  });

  it('lists only published jobs for public viewers', async () => {
    prismaService.job.findMany.mockResolvedValue([]);
    prismaService.job.count.mockResolvedValue(0);

    await service.list(null, { page: 1, limit: 10 });

    const findManyCalls = (
      prismaService.job.findMany as unknown as {
        mock: { calls: Array<Array<{ where?: { status?: JobStatus } }>> };
      }
    ).mock.calls;
    const findManyCall = findManyCalls[0]?.[0];
    expect(findManyCall?.where?.status).toBe(JobStatus.PUBLISHED);
  });

  it('lists recruiter owned jobs for recruiter viewers', async () => {
    prismaService.job.findMany.mockResolvedValue([]);
    prismaService.job.count.mockResolvedValue(0);

    await service.list(
      { sub: 'recruiter-1', role: UserRole.RECRUITER },
      { page: 1, limit: 10 },
    );

    const findManyCalls = (
      prismaService.job.findMany as unknown as {
        mock: { calls: Array<Array<{ where?: { recruiterId?: string } }>> };
      }
    ).mock.calls;
    const findManyCall = findManyCalls[0]?.[0];
    expect(findManyCall?.where?.recruiterId).toBe('recruiter-1');
  });

  it('rejects invalid salary range on create', async () => {
    await expect(
      service.create('recruiter-1', {
        title: 'Backend Engineer',
        description: 'Long enough description text',
        skills: ['TypeScript'],
        salaryMin: 5000,
        salaryMax: 1000,
        employmentType: 'FULL_TIME',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws forbidden when recruiter updates foreign job', async () => {
    prismaService.job.findFirst.mockResolvedValue(null);

    await expect(
      service.update('recruiter-1', 'job-foreign', {
        title: 'Updated title',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('creates a draft job from uploaded JD file and stores provenance', async () => {
    documentTextExtractorService.extract.mockResolvedValue(
      'Senior Backend Engineer with TypeScript and NestJS',
    );
    documentStorageService.save.mockResolvedValue('recruiter-1/jd.pdf');
    prismaService.job.create.mockResolvedValue({
      id: 'job-1',
      recruiterId: 'recruiter-1',
      title: 'Job',
      slug: 'job-1',
      description: 'Summary',
      skills: ['TypeScript'],
      location: {
        __normalization: {
          schemaVersion: 'candidate_job_profile_v1',
          parseStatus: 'parsed_ok',
          parseTelemetry: {
            source: 'llm',
            fallbackUsed: false,
            latencyMs: 100,
          },
          normalizedProfile: normalizedJobResult.profile,
          inputMode: 'file_upload',
          sourceDocument: {
            fileName: 'jd.pdf',
            mimeType: 'application/pdf',
            fileSize: 100,
            storedPath: 'recruiter-1/jd.pdf',
          },
        },
      },
      salaryMin: null,
      salaryMax: null,
      employmentType: 'FULL_TIME',
      status: JobStatus.DRAFT,
      publishedAt: null,
      closedAt: null,
      createdAt: new Date('2026-03-07T00:00:00.000Z'),
      updatedAt: new Date('2026-03-07T00:00:00.000Z'),
    });

    const result = await service.createFromFile('recruiter-1', {
      originalname: 'jd.pdf',
      mimetype: 'application/pdf',
      size: 100,
      buffer: Buffer.from('jd content'),
    } as Express.Multer.File);

    expect(documentTextExtractorService.assertSupported).toHaveBeenCalled();
    expect(documentStorageService.save).toHaveBeenCalledWith(
      'jobs',
      'recruiter-1',
      expect.objectContaining({ originalname: 'jd.pdf' }),
    );
    expect(result.status).toBe(JobStatus.DRAFT);
    expect(result.parseStatus).toBe('parsed_ok');
  });

  it('removes stored JD file if draft creation fails', async () => {
    documentTextExtractorService.extract.mockResolvedValue(
      'Senior Backend Engineer with TypeScript and NestJS',
    );
    documentStorageService.save.mockResolvedValue('recruiter-1/jd.pdf');
    prismaService.job.create.mockRejectedValue(new Error('db failure'));

    await expect(
      service.createFromFile('recruiter-1', {
        originalname: 'jd.pdf',
        mimetype: 'application/pdf',
        size: 100,
        buffer: Buffer.from('jd content'),
      } as Express.Multer.File),
    ).rejects.toThrow('db failure');

    expect(documentStorageService.remove).toHaveBeenCalledWith(
      'jobs',
      'recruiter-1/jd.pdf',
    );
  });

  it('preserves uploaded JD provenance when recruiter edits the draft', async () => {
    prismaService.job.findFirst.mockResolvedValue({
      id: 'job-1',
      recruiterId: 'recruiter-1',
      slug: 'job-1',
      title: 'Existing title',
      description: 'Existing description',
      skills: ['TypeScript'],
      location: {
        city: 'Ho Chi Minh City',
        __normalization: {
          inputMode: 'file_upload',
          sourceDocument: {
            fileName: 'jd.pdf',
            mimeType: 'application/pdf',
            fileSize: 100,
            storedPath: 'recruiter-1/jd.pdf',
          },
        },
      },
      employmentType: 'FULL_TIME',
      status: JobStatus.DRAFT,
    });
    prismaService.job.update.mockResolvedValue({
      id: 'job-1',
      recruiterId: 'recruiter-1',
      title: 'Updated title',
      slug: 'job-1',
      description: 'Updated description long enough',
      skills: ['TypeScript'],
      location: {
        city: 'Ho Chi Minh City',
        __normalization: {
          schemaVersion: 'candidate_job_profile_v1',
          parseStatus: 'parsed_ok',
          parseTelemetry: {
            source: 'llm',
            fallbackUsed: false,
            latencyMs: 100,
          },
          normalizedProfile: {
            schemaVersion: 'candidate_job_profile_v1',
            language: 'en',
            title: 'Job',
            summary: 'Summary',
            skills: ['TypeScript'],
            experience: [],
            education: [],
            certifications: [],
            projects: [],
            languages: [],
            location: { city: '', country: '' },
            rawQuality: { score: 90, needsManualReview: false, reason: '' },
            jobMeta: {
              requirements: [],
              benefits: [],
              employmentType: 'FULL_TIME',
            },
          },
          inputMode: 'file_upload',
          sourceDocument: {
            fileName: 'jd.pdf',
            mimeType: 'application/pdf',
            fileSize: 100,
            storedPath: 'recruiter-1/jd.pdf',
          },
        },
      },
      salaryMin: null,
      salaryMax: null,
      employmentType: 'FULL_TIME',
      status: JobStatus.DRAFT,
      publishedAt: null,
      closedAt: null,
      createdAt: new Date('2026-03-07T00:00:00.000Z'),
      updatedAt: new Date('2026-03-07T00:00:00.000Z'),
    });

    await service.update('recruiter-1', 'job-1', {
      title: 'Updated title',
      description: 'Updated description long enough',
    });

    const updateCalls = prismaService.job.update.mock.calls as Array<
      [{ data: { location: Record<string, unknown> } }]
    >;
    const updateCall = updateCalls[0]?.[0] as {
      data: { location: Record<string, unknown> };
    };
    const normalization = updateCall.data.location['__normalization'] as Record<
      string,
      unknown
    >;
    const sourceDocument = normalization['sourceDocument'] as Record<
      string,
      unknown
    >;

    expect(normalization['inputMode']).toBe('file_upload');
    expect(sourceDocument['fileName']).toBe('jd.pdf');
  });

  it('removes uploaded JD file when recruiter deletes the job', async () => {
    prismaService.job.findFirst.mockResolvedValue({
      id: 'job-1',
      recruiterId: 'recruiter-1',
      slug: 'job-1',
      title: 'Uploaded title',
      description: 'Uploaded description',
      skills: ['TypeScript'],
      location: {
        __normalization: {
          inputMode: 'file_upload',
          sourceDocument: {
            storedPath: 'recruiter-1/jd.pdf',
          },
        },
      },
      employmentType: 'FULL_TIME',
      status: JobStatus.DRAFT,
    });

    await service.softDelete('recruiter-1', 'job-1');

    const deleteCalls = prismaService.job.update.mock.calls as Array<
      [{ where: { id: string }; data: { deletedAt: Date } }]
    >;
    const deleteCall = deleteCalls[0]?.[0];

    expect(deleteCall?.where.id).toBe('job-1');
    expect(deleteCall?.data.deletedAt).toBeInstanceOf(Date);
    expect(documentStorageService.remove).toHaveBeenCalledWith(
      'jobs',
      'recruiter-1/jd.pdf',
    );
  });

  it('retries slug generation when createFromFile hits a unique constraint', async () => {
    generateUniqueSlug
      .mockResolvedValueOnce('job-1')
      .mockResolvedValueOnce('job-2');
    documentTextExtractorService.extract.mockResolvedValue(
      'Senior Backend Engineer with TypeScript and NestJS',
    );
    documentStorageService.save.mockResolvedValue('recruiter-1/jd.pdf');
    prismaService.job.create
      .mockRejectedValueOnce({ code: 'P2002' })
      .mockResolvedValueOnce({
        id: 'job-2',
        recruiterId: 'recruiter-1',
        title: 'Job',
        slug: 'job-2',
        description: 'Summary',
        skills: ['TypeScript'],
        location: null,
        salaryMin: null,
        salaryMax: null,
        employmentType: 'FULL_TIME',
        status: JobStatus.DRAFT,
        publishedAt: null,
        closedAt: null,
        createdAt: new Date('2026-03-07T00:00:00.000Z'),
        updatedAt: new Date('2026-03-07T00:00:00.000Z'),
      });

    const result = await service.createFromFile('recruiter-1', {
      originalname: 'jd.pdf',
      mimetype: 'application/pdf',
      size: 100,
      buffer: Buffer.from('jd content'),
    } as Express.Multer.File);

    expect(generateUniqueSlug).toHaveBeenCalledTimes(2);
    expect(prismaService.job.create).toHaveBeenCalledTimes(2);
    expect(documentStorageService.remove).not.toHaveBeenCalled();
    expect(result.slug).toBe('job-2');
  });
});
