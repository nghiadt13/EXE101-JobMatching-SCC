import { BadRequestException, ConflictException } from '@nestjs/common';
import { ApplicationStatus, UserRole } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { ScoreCombinerService } from '../matching/calculators/score-combiner.service';
import { SkillsCalculatorService } from '../matching/calculators/skills-calculator.service';
import { TfidfCalculatorService } from '../matching/calculators/tfidf-calculator.service';
import { MatchingService } from '../matching/matching.service';
import { SkillAtomizerService } from '../matching/services/skill-atomizer.service';
import { SkillCanonicalizerService } from '../matching/services/skill-canonicalizer.service';
import { SkillStorageAdapterService } from '../matching/services/skill-storage-adapter.service';
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
              tfidfScore: 0.75,
              skillsScore: 0.9,
              matchingVersion: 'v2',
              warnings: [],
              matchingSnapshot: {
                version: 'v2',
                componentScores: {
                  tfidf: 0.75,
                  skills: 0.9,
                  final: 80,
                },
                topMatchedSkills: ['TypeScript'],
                missingSkills: [],
                warnings: [],
              },
              breakdown: { matchedSkills: ['TypeScript'], missingSkills: [] },
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

  it('persists matching snapshot on successful application creation', async () => {
    prismaService.candidate.findFirst.mockResolvedValue({ id: 'cand-1' });
    prismaService.cV.findFirst.mockResolvedValue({ id: 'cv-1' });
    prismaService.job.findFirst.mockResolvedValue({ id: 'job-1' });
    prismaService.application.create.mockResolvedValue({
      id: 'app-1',
      jobId: 'job-1',
      candidateId: 'cand-1',
      cvId: 'cv-1',
      matchScore: 80,
      tfidfScore: 0.75,
      skillsScore: 0.9,
      matchingSnapshot: {
        version: 'v2',
        componentScores: {
          tfidf: 0.75,
          skills: 0.9,
          final: 80,
        },
        topMatchedSkills: ['TypeScript'],
        missingSkills: [],
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
    expect(createCalls[0]?.[0].data.matchingSnapshot.version).toBe('v2');
    expect(result.matchingSnapshot?.version).toBe('v2');
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
      tfidfScore: 0.7,
      skillsScore: 0.8,
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

  it('computes and persists a v2 snapshot while flagging missing canonical atoms', async () => {
    const integrationPrisma = {
      candidate: { findFirst: jest.fn().mockResolvedValue({ id: 'cand-2' }) },
      cV: {
        findFirst: jest
          .fn()
          .mockResolvedValueOnce({ id: 'cv-2' })
          .mockResolvedValueOnce({
            id: 'cv-2',
            candidateId: 'cand-2',
            skills: ['AWS: EC2'],
            skillAtoms: null,
            parsedData: { summary: 'Cloud engineer' },
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
            description: 'Need AWS EC2 experience',
            skills: ['EC2'],
            skillAtoms: null,
            location: null,
            status: 'PUBLISHED',
          }),
      },
      application: {
        create: jest.fn().mockImplementation(
          (input: {
            data: {
              matchScore: number;
              tfidfScore: number | null;
              skillsScore: number | null;
              matchingSnapshot: unknown;
            };
          }) => ({
            id: 'app-2',
            jobId: 'job-2',
            candidateId: 'cand-2',
            cvId: 'cv-2',
            matchScore: input.data.matchScore,
            tfidfScore: input.data.tfidfScore,
            skillsScore: input.data.skillsScore,
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
      new TfidfCalculatorService(),
      new SkillsCalculatorService(),
      new ScoreCombinerService(),
      new SkillStorageAdapterService(
        new SkillAtomizerService(new SkillCanonicalizerService()),
      ),
    );
    const integrationService = new ApplicationsService(
      integrationPrisma as unknown as PrismaService,
      integrationMatchingService,
    );

    const result = await integrationService.create(
      { sub: 'candidate-2', email: 'c2@e.com', role: UserRole.CANDIDATE },
      { cvId: 'cv-2', jobId: 'job-2' },
    );

    expect(result.matchingSnapshot?.version).toBe('v2');
    expect(result.matchingSnapshot?.topMatchedSkills).toEqual([]);
    expect(result.matchingSnapshot?.warnings).toEqual(
      expect.arrayContaining([
        'CV canonical skills are missing. Reprocess the CV before relying on this match.',
        'Job canonical skills are missing. Reprocess the JD before relying on this match.',
      ]),
    );
  });
});
