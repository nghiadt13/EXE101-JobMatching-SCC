import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JobStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ScoreCombinerService } from './calculators/score-combiner.service';
import { SkillsCalculatorService } from './calculators/skills-calculator.service';
import { TfidfCalculatorService } from './calculators/tfidf-calculator.service';
import { MatchingService } from './matching.service';

describe('MatchingService', () => {
  let service: MatchingService;
  let prismaService: {
    cV: { findFirst: jest.Mock };
    job: { findFirst: jest.Mock };
  };

  beforeEach(async () => {
    prismaService = {
      cV: { findFirst: jest.fn() },
      job: { findFirst: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchingService,
        TfidfCalculatorService,
        SkillsCalculatorService,
        ScoreCombinerService,
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    service = module.get<MatchingService>(MatchingService);
  });

  it('returns deterministic score for candidate own cv and published job', async () => {
    prismaService.cV.findFirst.mockResolvedValue({
      id: 'cv-1',
      candidateId: 'cand-1',
      skills: ['TypeScript', 'NestJS'],
      parsedData: { summary: 'Backend developer with NestJS' },
      candidate: { userId: 'candidate-1' },
    });
    prismaService.job.findFirst.mockResolvedValue({
      id: 'job-1',
      recruiterId: 'recruiter-1',
      description: 'Need a TypeScript backend engineer with NestJS.',
      skills: ['TypeScript', 'NestJS', 'Docker'],
      location: null,
      status: JobStatus.PUBLISHED,
    });

    const result = await service.calculateForCvAndJob('cv-1', 'job-1', {
      sub: 'candidate-1',
      role: UserRole.CANDIDATE,
    });

    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.breakdown.matchedSkills).toContain('TypeScript');
    expect(result.breakdown.missingSkills).toContain('Docker');
  });

  it('throws not found when candidate tries foreign cv', async () => {
    prismaService.cV.findFirst.mockResolvedValue({
      id: 'cv-2',
      candidateId: 'cand-2',
      skills: [],
      parsedData: {},
      candidate: { userId: 'candidate-2' },
    });

    await expect(
      service.calculateForCvAndJob('cv-2', 'job-1', {
        sub: 'candidate-1',
        role: UserRole.CANDIDATE,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws not found when candidate tries non-published job', async () => {
    prismaService.cV.findFirst.mockResolvedValue({
      id: 'cv-1',
      candidateId: 'cand-1',
      skills: [],
      parsedData: {},
      candidate: { userId: 'candidate-1' },
    });
    prismaService.job.findFirst.mockResolvedValue({
      id: 'job-draft',
      recruiterId: 'recruiter-1',
      description: 'Draft only',
      skills: ['Hiring'],
      location: null,
      status: JobStatus.DRAFT,
    });

    await expect(
      service.calculateForCvAndJob('cv-1', 'job-draft', {
        sub: 'candidate-1',
        role: UserRole.CANDIDATE,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('allows recruiter to calculate against own draft job', async () => {
    prismaService.cV.findFirst.mockResolvedValue({
      id: 'cv-3',
      candidateId: 'cand-3',
      skills: ['Sourcing'],
      parsedData: { summary: 'Recruiting specialist' },
      candidate: { userId: 'candidate-3' },
    });
    prismaService.job.findFirst.mockResolvedValue({
      id: 'job-2',
      recruiterId: 'recruiter-1',
      description: 'Need sourcing and communication',
      skills: ['Sourcing'],
      location: null,
      status: JobStatus.DRAFT,
    });

    const result = await service.calculateForCvAndJob('cv-3', 'job-2', {
      sub: 'recruiter-1',
      role: UserRole.RECRUITER,
    });

    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});
