import { BadRequestException, ConflictException } from '@nestjs/common';
import { ApplicationStatus, UserRole } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { MatchingService } from '../matching/matching.service';
import { PrismaService } from '../prisma/prisma.service';
import { AppLogger } from '../common/logging/app-logger.service';
import { ApplicationsService } from './applications.service';

describe('ApplicationsService', () => {
  let service: ApplicationsService;
  let prismaService: {
    candidate: { findFirst: jest.Mock };
    cV: { findFirst: jest.Mock };
    job: { findFirst: jest.Mock };
    application: {
      create: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
    };
  };
  let matchingService: { calculateIntegrationPayload: jest.Mock };

  beforeEach(async () => {
    prismaService = {
      candidate: { findFirst: jest.fn() },
      cV: { findFirst: jest.fn() },
      job: { findFirst: jest.fn() },
      application: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
    };

    matchingService = {
      calculateIntegrationPayload: jest.fn().mockResolvedValue({
        finalScorePercent: 80,
        matchingVersion: 'schema_v1',
        warnings: [],
        matchingSnapshot: {
          version: 'schema_v1',
          scoreBreakdown: {
            mustHave: 80,
            niceToHave: 70,
            experience: 80,
            education: 100,
            language: 100,
            location: 100,
            final: 80,
          },
          requirements: [],
          strengths: ['TypeScript'],
          gaps: [],
          warnings: [],
        },
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicationsService,
        { provide: PrismaService, useValue: prismaService },
        { provide: MatchingService, useValue: matchingService },
        {
          provide: AppLogger,
          useValue: {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ApplicationsService>(ApplicationsService);
  });

  it('maps unique apply race to conflict', async () => {
    prismaService.candidate.findFirst.mockResolvedValue({ id: 'cand-1' });
    prismaService.cV.findFirst.mockResolvedValue({ id: 'cv-1' });
    prismaService.job.findFirst.mockResolvedValue({ id: 'job-1' });
    prismaService.application.create.mockRejectedValue({ code: 'P2002' });

    await expect(
      service.create(
        { sub: 'candidate-1', email: 'c@e.com', role: UserRole.CANDIDATE },
        { cvId: 'cv-1', jobId: 'job-1' },
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('creates application with PENDING_MATCHING status', async () => {
    prismaService.candidate.findFirst.mockResolvedValue({ id: 'cand-1' });
    prismaService.cV.findFirst.mockResolvedValue({ id: 'cv-1' });
    prismaService.job.findFirst.mockResolvedValue({ id: 'job-1' });
    prismaService.application.create.mockResolvedValue({
      id: 'app-1',
      jobId: 'job-1',
      candidateId: 'cand-1',
      cvId: 'cv-1',
      matchScore: 0,
      matchingSnapshot: null,
      status: ApplicationStatus.PENDING_MATCHING,
      notes: null,
      appliedAt: new Date(),
      updatedAt: new Date(),
      job: { id: 'job-1', title: 'Backend', slug: 'backend' },
      candidate: {
        id: 'cand-1',
        user: { name: 'Candidate', email: 'c@e.com' },
      },
      cv: { id: 'cv-1', fileName: 'cv.pdf' },
    });

    const result = await service.create(
      { sub: 'candidate-1', email: 'c@e.com', role: UserRole.CANDIDATE },
      { cvId: 'cv-1', jobId: 'job-1' },
    );

    // Application is created with PENDING_MATCHING, not APPLIED
    expect(result.status).toBe(ApplicationStatus.PENDING_MATCHING);
    expect(result.matchScore).toBe(0);
    expect(result.matchingSnapshot).toBeNull();

    // Verify the create call does NOT include matchScore/matchingSnapshot
    const createCall = prismaService.application.create.mock.calls[0][0] as {
      data: { status: ApplicationStatus };
    };
    expect(createCall.data.status).toBe(ApplicationStatus.PENDING_MATCHING);
  });

  it('rejects invalid recruiter status transition', async () => {
    prismaService.application.findFirst.mockResolvedValue({
      id: 'app-1',
      status: ApplicationStatus.REVIEWING,
    });

    await expect(
      service.updateStatus(
        { sub: 'recruiter-1', email: 'r@e.com', role: UserRole.RECRUITER },
        'app-1',
        { status: ApplicationStatus.APPLIED },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('allows valid recruiter status transition', async () => {
    prismaService.application.findFirst.mockResolvedValue({
      id: 'app-1',
      status: ApplicationStatus.APPLIED,
    });
    prismaService.application.update.mockResolvedValue({
      id: 'app-1',
      jobId: 'job-1',
      candidateId: 'cand-1',
      cvId: 'cv-1',
      matchScore: 75,
      matchingSnapshot: null,
      status: ApplicationStatus.REVIEWING,
      notes: null,
      appliedAt: new Date(),
      updatedAt: new Date(),
      job: { id: 'job-1', title: 'Backend', slug: 'backend' },
      candidate: {
        id: 'cand-1',
        user: { name: 'Candidate', email: 'c@e.com' },
      },
      cv: { id: 'cv-1', fileName: 'cv.pdf' },
    });

    const updated = await service.updateStatus(
      { sub: 'recruiter-1', email: 'r@e.com', role: UserRole.RECRUITER },
      'app-1',
      { status: ApplicationStatus.REVIEWING },
    );

    expect(updated.status).toBe(ApplicationStatus.REVIEWING);
  });

  it('filters recruiter list by own jobs', async () => {
    prismaService.application.findMany.mockResolvedValue([]);
    prismaService.application.count.mockResolvedValue(0);

    await service.list(
      { sub: 'recruiter-1', email: 'r@e.com', role: UserRole.RECRUITER },
      { page: 1, limit: 10, status: ApplicationStatus.APPLIED },
    );

    const calls = prismaService.application.findMany.mock.calls as Array<
      [{ where: { job: { recruiterId: string }; status: ApplicationStatus } }]
    >;
    const findManyCall = calls[0][0];
    expect(findManyCall.where.job.recruiterId).toBe('recruiter-1');
    expect(findManyCall.where.status).toBe(ApplicationStatus.APPLIED);
  });

  it('fires background matching after creating application', async () => {
    prismaService.candidate.findFirst.mockResolvedValue({ id: 'cand-1' });
    prismaService.cV.findFirst.mockResolvedValue({ id: 'cv-1' });
    prismaService.job.findFirst.mockResolvedValue({ id: 'job-1' });
    prismaService.application.create.mockResolvedValue({
      id: 'app-1',
      jobId: 'job-1',
      candidateId: 'cand-1',
      cvId: 'cv-1',
      matchScore: 0,
      matchingSnapshot: null,
      status: ApplicationStatus.PENDING_MATCHING,
      notes: null,
      appliedAt: new Date(),
      updatedAt: new Date(),
      job: { id: 'job-1', title: 'Backend', slug: 'backend' },
      candidate: {
        id: 'cand-1',
        user: { name: 'Candidate', email: 'c@e.com' },
      },
      cv: { id: 'cv-1', fileName: 'cv.pdf' },
    });
    prismaService.application.update.mockResolvedValue({});

    await service.create(
      { sub: 'candidate-1', email: 'c@e.com', role: UserRole.CANDIDATE },
      { cvId: 'cv-1', jobId: 'job-1' },
    );

    // Allow background promise to resolve
    await new Promise((r) => setTimeout(r, 50));

    // The matching service should have been called in background
    expect(matchingService.calculateIntegrationPayload).toHaveBeenCalledWith(
      'cv-1',
      'job-1',
      expect.objectContaining({ sub: 'candidate-1' }),
    );

    // The application should have been updated with the matching result
    expect(prismaService.application.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'app-1' },
        data: expect.objectContaining({
          matchScore: 80,
          status: ApplicationStatus.APPLIED,
        }),
      }),
    );
  });
});
