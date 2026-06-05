import {
  BadRequestException,
  ForbiddenException,
  ServiceUnavailableException,
  UnprocessableEntityException,
  UnauthorizedException,
} from '@nestjs/common';
import { JobStatus, UserRole } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { DocumentStorageService } from '../documents/services/document-storage.service';
import { DocumentTextExtractorService } from '../documents/services/document-text-extractor.service';
import { HomepageCacheService } from '../homepage/homepage-cache.service';
import { JobRequirementsSchemaService } from '../matching/services/job-requirements-schema.service';
import { SkillStorageAdapterService } from '../matching/services/skill-storage-adapter.service';
import { PrismaService } from '../prisma/prisma.service';
import { AiNormalizationService } from '../normalization/ai-normalization.service';
import { AiNormalizationError } from '../normalization/normalization.errors';
import { AppLogger } from '../common/logging/app-logger.service';
import { JobsService } from './jobs.service';
import { JobSlugService } from './services/job-slug.service';
import { VectorSyncService } from '../matching/rag/vector-sync.service';

describe('JobsService', () => {
  let service: JobsService;
  let documentStorageService: { save: jest.Mock; remove: jest.Mock };
  let documentTextExtractorService: {
    assertSupported: jest.Mock;
    extract: jest.Mock;
  };
  let prismaService: {
    user: {
      findFirst: jest.Mock;
    };
    job: {
      create: jest.Mock;
      delete: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
    };
  };
  let aiNormalizationService: { normalizeJob: jest.Mock };
  let skillStorageAdapterService: { toStoredSkills: jest.Mock };
  let homepageCacheService: { clearAll: jest.Mock; clearByUser: jest.Mock };
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
    telemetry: {
      provider: 'gemini' as const,
      model: 'gemini-3.1-flash-lite-preview',
      latencyMs: 100,
    },
  };

  beforeEach(async () => {
    documentStorageService = { save: jest.fn(), remove: jest.fn() };
    documentTextExtractorService = {
      assertSupported: jest.fn(),
      extract: jest.fn(),
    };
    prismaService = {
      user: {
        findFirst: jest.fn().mockResolvedValue({ id: 'recruiter-1' }),
      },
      job: {
        create: jest.fn(),
        delete: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };
    aiNormalizationService = {
      normalizeJob: jest.fn().mockResolvedValue(normalizedJobResult),
    };
    homepageCacheService = {
      clearAll: jest.fn(),
      clearByUser: jest.fn(),
    };
    skillStorageAdapterService = {
      toStoredSkills: jest.fn((skills: string[]) => ({
        skills,
        skillAtoms: [],
      })),
    };
    generateUniqueSlug = jest.fn().mockResolvedValue('job-1');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsService,
        { provide: PrismaService, useValue: prismaService },
        { provide: AiNormalizationService, useValue: aiNormalizationService },
        {
          provide: SkillStorageAdapterService,
          useValue: skillStorageAdapterService,
        },
        JobRequirementsSchemaService,
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
        {
          provide: AppLogger,
          useValue: {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
          },
        },
        {
          provide: HomepageCacheService,
          useValue: homepageCacheService,
        },
        {
          provide: VectorSyncService,
          useValue: { syncJob: jest.fn().mockResolvedValue(undefined) },
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

  it('applies v1 search query alias when filter flag is enabled', async () => {
    process.env.API_JOBS_FILTERS_V1_ENABLED = 'true';
    prismaService.job.findMany.mockResolvedValue([]);
    prismaService.job.count.mockResolvedValue(0);

    await service.list(null, { page: 1, limit: 10, search: 'nestjs' });

    const findManyCalls = (
      prismaService.job.findMany as unknown as {
        mock: {
          calls: Array<
            Array<{
              where?: {
                AND?: Array<{ OR?: Array<{ title?: { contains?: string } }> }>;
              };
            }>
          >;
        };
      }
    ).mock.calls;
    const findManyCall = findManyCalls[0]?.[0];
    expect(findManyCall?.where?.AND?.[0]?.OR?.[0]?.title?.contains).toBe(
      'nestjs',
    );
    delete process.env.API_JOBS_FILTERS_V1_ENABLED;
  });

  it('rejects invalid salary filter range for list query', async () => {
    process.env.API_JOBS_FILTERS_V1_ENABLED = 'true';

    await expect(
      service.list(null, {
        page: 1,
        limit: 20,
        salaryMinGte: 4000,
        salaryMaxLte: 2000,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    delete process.env.API_JOBS_FILTERS_V1_ENABLED;
  });

  it('uses salary sort order when requested in v1 mode', async () => {
    process.env.API_JOBS_FILTERS_V1_ENABLED = 'true';
    prismaService.job.findMany.mockResolvedValue([]);
    prismaService.job.count.mockResolvedValue(0);

    await service.list(null, { page: 1, limit: 10, sort: 'salary_desc' });

    const findManyCalls = (
      prismaService.job.findMany as unknown as {
        mock: { calls: Array<Array<{ orderBy?: unknown }>> };
      }
    ).mock.calls;
    const findManyCall = findManyCalls[0]?.[0];
    expect(Array.isArray(findManyCall?.orderBy)).toBe(true);
    expect(findManyCall?.orderBy).toEqual(
      expect.arrayContaining([expect.objectContaining({ salaryMax: 'desc' })]),
    );

    delete process.env.API_JOBS_FILTERS_V1_ENABLED;
  });

  it('rejects recruiter job listing when recruiter token no longer maps to an active recruiter user', async () => {
    prismaService.user.findFirst.mockResolvedValueOnce(null);

    await expect(
      service.list(
        { sub: 'stale-recruiter', role: UserRole.RECRUITER },
        { page: 1, limit: 10 },
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(prismaService.job.findMany).not.toHaveBeenCalled();
    expect(prismaService.job.count).not.toHaveBeenCalled();
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

  it('rejects manual job creation when recruiter token no longer maps to an active recruiter user', async () => {
    prismaService.user.findFirst.mockResolvedValueOnce(null);

    await expect(
      service.create('stale-recruiter', {
        title: 'Backend Engineer',
        description: 'Long enough description text',
        skills: ['TypeScript'],
        employmentType: 'FULL_TIME',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(aiNormalizationService.normalizeJob).not.toHaveBeenCalled();
    expect(prismaService.job.create).not.toHaveBeenCalled();
  });

  it('throws forbidden when recruiter updates foreign job', async () => {
    prismaService.job.findFirst.mockResolvedValue(null);

    await expect(
      service.update('recruiter-1', 'job-foreign', {
        title: 'Updated title',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects recruiter job update when recruiter token no longer maps to an active recruiter user', async () => {
    prismaService.user.findFirst.mockResolvedValueOnce(null);

    await expect(
      service.update('stale-recruiter', 'job-1', {
        title: 'Updated title',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(prismaService.job.findFirst).not.toHaveBeenCalled();
    expect(prismaService.job.update).not.toHaveBeenCalled();
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
            provider: 'gemini',
            model: 'gemini-3.1-flash-lite-preview',
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

  it('rejects JD upload when recruiter token no longer maps to an active recruiter user', async () => {
    prismaService.user.findFirst.mockResolvedValueOnce(null);

    await expect(
      service.createFromFile('stale-recruiter', {
        originalname: 'jd.pdf',
        mimetype: 'application/pdf',
        size: 100,
        buffer: Buffer.from('jd content'),
      } as Express.Multer.File),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(documentTextExtractorService.assertSupported).not.toHaveBeenCalled();
    expect(documentStorageService.save).not.toHaveBeenCalled();
    expect(prismaService.job.create).not.toHaveBeenCalled();
  });

  it('falls back to normalized-profile skills when legacy jobs have empty skills arrays', async () => {
    prismaService.job.findFirst.mockResolvedValue({
      id: 'job-legacy-view',
      recruiterId: 'recruiter-1',
      title: 'Legacy imported job',
      slug: 'legacy-imported-job',
      description: 'Imported description',
      skills: [],
      location: {
        __normalization: {
          parseStatus: 'parsed_ok',
          normalizedProfile: {
            ...normalizedJobResult.profile,
            skills: ['Docker', 'Kubernetes'],
          },
          inputMode: 'file_upload',
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

    const result = await service.getByIdOrSlug(
      { sub: 'recruiter-1', role: UserRole.RECRUITER },
      'job-legacy-view',
    );

    expect(result.skills).toEqual(['Docker', 'Kubernetes']);
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

  it('rolls back the created job if response mapping fails after persistence', async () => {
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
            provider: 'gemini',
            model: 'gemini-3.1-flash-lite-preview',
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
    prismaService.job.delete.mockResolvedValue({ id: 'job-1' });
    jest.spyOn(service as never, 'toView' as never).mockImplementation(() => {
      throw new Error('view failure');
    });

    await expect(
      service.createFromFile('recruiter-1', {
        originalname: 'jd.pdf',
        mimetype: 'application/pdf',
        size: 100,
        buffer: Buffer.from('jd content'),
      } as Express.Multer.File),
    ).rejects.toThrow('view failure');

    expect(prismaService.job.delete).toHaveBeenCalledWith({
      where: { id: 'job-1' },
    });
    expect(documentStorageService.remove).toHaveBeenCalledWith(
      'jobs',
      'recruiter-1/jd.pdf',
    );
  });

  it('keeps the stored JD file when job rollback fails after persistence', async () => {
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
            provider: 'gemini',
            model: 'gemini-3.1-flash-lite-preview',
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
    prismaService.job.delete.mockRejectedValue(new Error('rollback failed'));
    jest.spyOn(service as never, 'toView' as never).mockImplementation(() => {
      throw new Error('view failure');
    });

    await expect(
      service.createFromFile('recruiter-1', {
        originalname: 'jd.pdf',
        mimetype: 'application/pdf',
        size: 100,
        buffer: Buffer.from('jd content'),
      } as Express.Multer.File),
    ).rejects.toThrow('view failure');

    expect(prismaService.job.delete).toHaveBeenCalledWith({
      where: { id: 'job-1' },
    });
    expect(documentStorageService.remove).not.toHaveBeenCalled();
  });

  it('fails the JD upload when AI normalization fails', async () => {
    documentTextExtractorService.extract.mockResolvedValue('Uploaded JD text');
    aiNormalizationService.normalizeJob.mockRejectedValue(
      new Error('llm failed'),
    );

    try {
      await service.createFromFile('recruiter-1', {
        originalname: 'jd.pdf',
        mimetype: 'application/pdf',
        size: 100,
        buffer: Buffer.from('jd content'),
      } as Express.Multer.File);
      fail('Expected JD upload to fail');
    } catch (error) {
      expect(error).toBeInstanceOf(UnprocessableEntityException);
      expect(
        (error as UnprocessableEntityException).getResponse(),
      ).toMatchObject({
        code: 'JD_PARSE_FAILED',
        details: { stage: 'normalization' },
      });
    }

    expect(documentStorageService.save).not.toHaveBeenCalled();
  });

  it('returns service unavailable when the AI provider is unavailable', async () => {
    documentTextExtractorService.extract.mockResolvedValue('Uploaded JD text');
    aiNormalizationService.normalizeJob.mockRejectedValue(
      new AiNormalizationError('service_unavailable', 'provider down'),
    );

    try {
      await service.createFromFile('recruiter-1', {
        originalname: 'jd.pdf',
        mimetype: 'application/pdf',
        size: 100,
        buffer: Buffer.from('jd content'),
      } as Express.Multer.File);
      fail('Expected JD upload to fail');
    } catch (error) {
      expect(error).toBeInstanceOf(ServiceUnavailableException);
      expect(
        (error as ServiceUnavailableException).getResponse(),
      ).toMatchObject({
        code: 'AI_SERVICE_UNAVAILABLE',
        details: { stage: 'normalization' },
      });
    }
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
            provider: 'gemini',
            model: 'gemini-3.1-flash-lite-preview',
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

  it('does not renormalize uploaded jobs for salary-only updates', async () => {
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
          parseStatus: 'parsed_ok',
          normalizedProfile: normalizedJobResult.profile,
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
      title: 'Existing title',
      slug: 'job-1',
      description: 'Existing description',
      skills: ['TypeScript'],
      location: {
        city: 'Ho Chi Minh City',
        __normalization: {
          inputMode: 'file_upload',
          parseStatus: 'parsed_ok',
          normalizedProfile: normalizedJobResult.profile,
          sourceDocument: {
            fileName: 'jd.pdf',
            mimeType: 'application/pdf',
            fileSize: 100,
            storedPath: 'recruiter-1/jd.pdf',
          },
        },
      },
      salaryMin: 1000,
      salaryMax: 2000,
      employmentType: 'FULL_TIME',
      status: JobStatus.DRAFT,
      publishedAt: null,
      closedAt: null,
      createdAt: new Date('2026-03-07T00:00:00.000Z'),
      updatedAt: new Date('2026-03-07T00:00:00.000Z'),
    });

    await service.update('recruiter-1', 'job-1', {
      salaryMin: 1000,
      salaryMax: 2000,
    });

    expect(aiNormalizationService.normalizeJob).not.toHaveBeenCalled();
    const updateCalls = prismaService.job.update.mock.calls as Array<
      [{ data: Record<string, unknown> }]
    >;
    expect(updateCalls[0]?.[0].data).not.toHaveProperty('skills');
    expect(updateCalls[0]?.[0].data).not.toHaveProperty('skillAtoms');
  });

  it('reuses normalized-profile skills when legacy uploaded jobs have empty skills columns', async () => {
    skillStorageAdapterService.toStoredSkills.mockReturnValue({
      skills: ['Docker', 'Kubernetes'],
      skillAtoms: [
        {
          raw: 'Docker',
          label: 'Docker',
          canonical: 'docker',
          group: null,
          source: 'job_parsed',
        },
        {
          raw: 'Kubernetes',
          label: 'Kubernetes',
          canonical: 'kubernetes',
          group: null,
          source: 'job_parsed',
        },
      ],
    });
    prismaService.job.findFirst.mockResolvedValue({
      id: 'job-legacy',
      recruiterId: 'recruiter-1',
      slug: 'job-legacy',
      title: 'Imported title',
      description: 'Imported description',
      skills: [],
      location: {
        __normalization: {
          inputMode: 'file_upload',
          normalizedProfile: {
            ...normalizedJobResult.profile,
            skills: ['Docker', 'Kubernetes'],
          },
        },
      },
      employmentType: 'FULL_TIME',
      status: JobStatus.DRAFT,
    });
    prismaService.job.update.mockResolvedValue({
      id: 'job-legacy',
      recruiterId: 'recruiter-1',
      title: 'Imported title',
      slug: 'job-legacy',
      description: 'Edited description',
      skills: ['Docker', 'Kubernetes'],
      location: {
        __normalization: {
          inputMode: 'file_upload',
          normalizedProfile: {
            ...normalizedJobResult.profile,
            skills: ['Docker', 'Kubernetes'],
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

    await service.update('recruiter-1', 'job-legacy', {
      description: 'Edited description',
    });

    expect(aiNormalizationService.normalizeJob).toHaveBeenCalledWith(
      expect.stringContaining('Skills: Docker, Kubernetes'),
    );
    const updateCalls = prismaService.job.update.mock.calls as Array<
      [{ data: { skills: string[]; skillAtoms: Array<{ canonical: string }> } }]
    >;
    expect(updateCalls[0]?.[0].data.skills).toEqual(['Docker', 'Kubernetes']);
    expect(updateCalls[0]?.[0].data.skillAtoms).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ canonical: 'docker' }),
        expect.objectContaining({ canonical: 'kubernetes' }),
      ]),
    );
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

  it('saves a published job for candidate and invalidates user homepage cache', async () => {
    prismaService.user.findFirst.mockResolvedValueOnce({
      id: 'candidate-1',
      role: UserRole.CANDIDATE,
    });
    prismaService.job.findFirst.mockResolvedValueOnce({
      id: 'job-1',
      recruiterId: 'recruiter-1',
      status: JobStatus.PUBLISHED,
    });
    (prismaService as unknown as { savedJob: { upsert: jest.Mock } }).savedJob =
      {
        upsert: jest.fn().mockResolvedValue({
          id: 'saved-1',
          userId: 'candidate-1',
          jobId: 'job-1',
        }),
      };

    const result = await service.saveJob('candidate-1', 'job-1');

    expect(result).toEqual({ jobId: 'job-1', isSaved: true });
    expect(
      (prismaService as unknown as { savedJob: { upsert: jest.Mock } }).savedJob
        .upsert,
    ).toHaveBeenCalledWith({
      where: {
        userId_jobId: {
          userId: 'candidate-1',
          jobId: 'job-1',
        },
      },
      create: {
        userId: 'candidate-1',
        jobId: 'job-1',
      },
      update: {},
    });
    expect(homepageCacheService.clearByUser).toHaveBeenCalledWith(
      'candidate-1',
    );
  });

  it('unsaves a job and invalidates user homepage cache', async () => {
    prismaService.user.findFirst.mockResolvedValueOnce({
      id: 'candidate-1',
      role: UserRole.CANDIDATE,
    });
    prismaService.job.findFirst.mockResolvedValueOnce({
      id: 'job-1',
      recruiterId: 'recruiter-1',
      status: JobStatus.PUBLISHED,
    });
    (
      prismaService as unknown as { savedJob: { deleteMany: jest.Mock } }
    ).savedJob = {
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
    };

    const result = await service.unsaveJob('candidate-1', 'job-1');

    expect(result).toEqual({ jobId: 'job-1', isSaved: false });
    expect(
      (prismaService as unknown as { savedJob: { deleteMany: jest.Mock } })
        .savedJob.deleteMany,
    ).toHaveBeenCalledWith({
      where: {
        userId: 'candidate-1',
        jobId: 'job-1',
      },
    });
    expect(homepageCacheService.clearByUser).toHaveBeenCalledWith(
      'candidate-1',
    );
  });
});
