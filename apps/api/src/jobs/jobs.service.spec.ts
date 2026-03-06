import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { JobStatus, UserRole } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { AiNormalizationService } from '../normalization/ai-normalization.service';
import { JobsService } from './jobs.service';
import { JobSlugService } from './services/job-slug.service';

describe('JobsService', () => {
  let service: JobsService;
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

  beforeEach(async () => {
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
      normalizeJob: jest.fn().mockResolvedValue({
        schemaVersion: 'candidate_job_profile_v1',
        status: 'parsed_ok',
        profile: {
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
        telemetry: { source: 'llm', fallbackUsed: false, latencyMs: 100 },
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsService,
        { provide: PrismaService, useValue: prismaService },
        { provide: AiNormalizationService, useValue: aiNormalizationService },
        {
          provide: JobSlugService,
          useValue: {
            generateUniqueSlug: jest.fn().mockResolvedValue('job-1'),
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
});
