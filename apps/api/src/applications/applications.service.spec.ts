import { BadRequestException, ConflictException } from '@nestjs/common';
import { ApplicationStatus, JobStatus, UserRole } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { CandidateProfileService } from '../matching/services/candidate-profile.service';
import { JobRequirementsSchemaService } from '../matching/services/job-requirements-schema.service';
import { SchemaMatchingEvaluatorService } from '../matching/services/schema-matching-evaluator.service';
import { MatchingService } from '../matching/matching.service';
import { PrismaService } from '../prisma/prisma.service';
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicationsService,
        { provide: PrismaService, useValue: prismaService },
        {
          provide: MatchingService,
          useValue: {
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

  it('persists schema snapshot on successful application creation', async () => {
    prismaService.candidate.findFirst.mockResolvedValue({ id: 'cand-1' });
    prismaService.cV.findFirst.mockResolvedValue({ id: 'cv-1' });
    prismaService.job.findFirst.mockResolvedValue({ id: 'job-1' });
    prismaService.application.create.mockResolvedValue({
      id: 'app-1',
      jobId: 'job-1',
      candidateId: 'cand-1',
      cvId: 'cv-1',
      matchScore: 80,
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
      status: ApplicationStatus.APPLIED,
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

    const createCalls = prismaService.application.create.mock.calls as Array<
      [{ data: { matchingSnapshot: { version: string } } }]
    >;
    expect(createCalls[0]?.[0].data.matchingSnapshot.version).toBe('schema_v1');
    expect(result.matchingSnapshot?.version).toBe('schema_v1');
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

  it('computes and persists a schema_v1 snapshot in integration mode', async () => {
    const integrationPrisma = {
      candidate: { findFirst: jest.fn().mockResolvedValue({ id: 'cand-2' }) },
      cV: {
        findFirst: jest
          .fn()
          .mockResolvedValueOnce({ id: 'cv-2' })
          .mockResolvedValueOnce({
            id: 'cv-2',
            candidateId: 'cand-2',
            skills: ['AWS', 'EC2'],
            candidateProfile: null,
            rawText: 'Cloud engineer with 3 years AWS EC2 experience',
            filePath: 'cand-2/cv-2.pdf',
            parsedData: {
              summary: 'Cloud engineer',
              normalizedProfile: {
                title: 'Cloud engineer',
                summary: 'Cloud engineer',
                skills: ['AWS', 'EC2'],
                experience: [
                  {
                    role: 'Cloud Engineer',
                    company: 'ACME',
                    startDate: '2022-01',
                    endDate: '2025-01',
                    tech: ['AWS', 'EC2'],
                  },
                ],
                education: [],
                certifications: [],
                projects: [],
                languages: [],
                location: { city: '', country: '' },
                rawQuality: { score: 90, needsManualReview: false, reason: '' },
              },
            },
            candidate: { userId: 'candidate-2' },
          }),
      },
      job: {
        findFirst: jest
          .fn()
          .mockResolvedValueOnce({ id: 'job-2' })
          .mockResolvedValueOnce({
            id: 'job-2',
            recruiterId: 'recruiter-1',
            title: 'Cloud role',
            description: 'Need AWS EC2 experience',
            skills: ['AWS', 'EC2'],
            requirementsSchema: null,
            location: {
              __normalization: {
                normalizedProfile: {
                  summary: 'Need AWS EC2 experience',
                  jobMeta: {
                    requirements: ['3+ years AWS EC2 experience'],
                  },
                  rawQuality: { score: 90, needsManualReview: false, reason: '' },
                },
              },
            },
            status: JobStatus.PUBLISHED,
          }),
      },
      application: {
        create: jest.fn().mockImplementation(
          (input: {
            data: {
              matchScore: number;
              matchingSnapshot: unknown;
            };
          }) => ({
            id: 'app-2',
            jobId: 'job-2',
            candidateId: 'cand-2',
            cvId: 'cv-2',
            matchScore: input.data.matchScore,
            matchingSnapshot: input.data.matchingSnapshot,
            status: ApplicationStatus.APPLIED,
            notes: null,
            appliedAt: new Date(),
            updatedAt: new Date(),
            job: { id: 'job-2', title: 'Cloud role', slug: 'cloud-role' },
            candidate: {
              id: 'cand-2',
              user: { name: 'Candidate', email: 'c2@e.com' },
            },
            cv: { id: 'cv-2', fileName: 'cv.pdf' },
          }),
        ),
        findFirst: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
    };
    const integrationMatchingService = new MatchingService(
      integrationPrisma as unknown as PrismaService,
      new JobRequirementsSchemaService(),
      new CandidateProfileService(),
      new SchemaMatchingEvaluatorService(),
      {
        evaluate: jest.fn().mockResolvedValue({
          finalScorePercent: 88,
          snapshot: {
            version: 'matching_snapshot_v2',
            scoreBreakdown: { skillScore: 86, constraintScore: 100, final: 88 },
            requirements: [],
            constraints: [],
            candidateSummary: {
              headline: 'Cloud engineer',
              totalExperienceMonths: 36,
              relevantExperienceMonths: 36,
              skills: ['AWS', 'EC2'],
              location: null,
            },
            strengths: ['AWS'],
            gaps: [],
            constraintsFailed: [],
            warnings: [],
          },
        }),
      } as any,
      { getAbsolutePath: jest.fn() } as any,
      { extract: jest.fn() } as any,
    );
    const integrationService = new ApplicationsService(
      integrationPrisma as unknown as PrismaService,
      integrationMatchingService,
    );

    const result = await integrationService.create(
      { sub: 'candidate-2', email: 'c2@e.com', role: UserRole.CANDIDATE },
      { cvId: 'cv-2', jobId: 'job-2' },
    );

    expect(result.matchingSnapshot?.version).toBe('matching_snapshot_v2');
    expect(result.matchScore).toBeGreaterThanOrEqual(0);
  });
});
