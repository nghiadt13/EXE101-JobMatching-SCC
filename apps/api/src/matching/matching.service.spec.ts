import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JobStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ScoreCombinerService } from './calculators/score-combiner.service';
import { SkillsCalculatorService } from './calculators/skills-calculator.service';
import { TfidfCalculatorService } from './calculators/tfidf-calculator.service';
import { MatchingService } from './matching.service';
import { SkillAtomizerService } from './services/skill-atomizer.service';
import { SkillCanonicalizerService } from './services/skill-canonicalizer.service';
import { SkillStorageAdapterService } from './services/skill-storage-adapter.service';

describe('MatchingService', () => {
  let service: MatchingService;
  let prismaService: {
    cV: { findFirst: jest.Mock };
    job: { findFirst: jest.Mock };
  };

  beforeEach(async () => {
    delete process.env.MATCHING_VERSION;
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
        SkillCanonicalizerService,
        SkillAtomizerService,
        SkillStorageAdapterService,
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    service = module.get<MatchingService>(MatchingService);
  });

  afterEach(() => {
    delete process.env.MATCHING_VERSION;
  });

  it('returns deterministic score for candidate own cv and published job', async () => {
    prismaService.cV.findFirst.mockResolvedValue({
      id: 'cv-1',
      candidateId: 'cand-1',
      skills: ['TypeScript', 'NestJS'],
      skillAtoms: [
        {
          raw: 'TypeScript',
          label: 'TypeScript',
          canonical: 'typescript',
          group: null,
          source: 'cv_parsed',
        },
        {
          raw: 'NestJS',
          label: 'NestJS',
          canonical: 'nestjs',
          group: null,
          source: 'cv_parsed',
        },
      ],
      parsedData: { summary: 'Backend developer with NestJS' },
      candidate: { userId: 'candidate-1' },
    });
    prismaService.job.findFirst.mockResolvedValue({
      id: 'job-1',
      recruiterId: 'recruiter-1',
      description: 'Need a TypeScript backend engineer with NestJS.',
      skills: ['TypeScript', 'NestJS', 'Docker'],
      skillAtoms: [
        {
          raw: 'TypeScript',
          label: 'TypeScript',
          canonical: 'typescript',
          group: null,
          source: 'job_parsed',
        },
        {
          raw: 'NestJS',
          label: 'NestJS',
          canonical: 'nestjs',
          group: null,
          source: 'job_parsed',
        },
        {
          raw: 'Docker',
          label: 'Docker',
          canonical: 'docker',
          group: null,
          source: 'job_parsed',
        },
      ],
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

  it('uses uploaded JD normalized skills from location metadata for matching', async () => {
    prismaService.cV.findFirst.mockResolvedValue({
      id: 'cv-4',
      candidateId: 'cand-4',
      skills: ['TypeScript'],
      skillAtoms: [
        {
          raw: 'Docker',
          label: 'Docker',
          canonical: 'docker',
          group: null,
          source: 'cv_parsed',
        },
      ],
      parsedData: {
        normalizedProfile: {
          skills: ['TypeScript', 'Docker'],
        },
        summary: 'Backend engineer with Docker experience',
      },
      candidate: { userId: 'candidate-4' },
    });
    prismaService.job.findFirst.mockResolvedValue({
      id: 'job-uploaded',
      recruiterId: 'recruiter-1',
      description: 'Imported draft job',
      skills: [],
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
      location: {
        __normalization: {
          normalizedProfile: {
            skills: ['Docker', 'Kubernetes'],
          },
        },
      },
      status: JobStatus.PUBLISHED,
    });

    const result = await service.calculateForCvAndJob('cv-4', 'job-uploaded', {
      sub: 'candidate-4',
      role: UserRole.CANDIDATE,
    });

    expect(result.breakdown.matchedSkills).toContain('Docker');
    expect(result.breakdown.missingSkills).toContain('Kubernetes');
    expect(result.warnings).toEqual([]);
  });

  it('supports explicit legacy rollback mode', async () => {
    process.env.MATCHING_VERSION = 'legacy';
    prismaService.cV.findFirst.mockResolvedValue({
      id: 'cv-5',
      candidateId: 'cand-5',
      skills: ['AWS: EC2, S3, Lambda'],
      skillAtoms: [
        {
          raw: 'AWS: EC2, S3, Lambda',
          label: 'EC2',
          canonical: 'ec2',
          group: 'AWS',
          source: 'cv_parsed',
        },
      ],
      parsedData: { summary: 'Cloud engineer' },
      candidate: { userId: 'candidate-5' },
    });
    prismaService.job.findFirst.mockResolvedValue({
      id: 'job-legacy',
      recruiterId: 'recruiter-1',
      description: 'Need AWS EC2 experience',
      skills: ['EC2'],
      skillAtoms: [
        {
          raw: 'EC2',
          label: 'EC2',
          canonical: 'ec2',
          group: null,
          source: 'job_parsed',
        },
      ],
      location: null,
      status: JobStatus.PUBLISHED,
    });

    const result = await service.calculateForCvAndJob('cv-5', 'job-legacy', {
      sub: 'candidate-5',
      role: UserRole.CANDIDATE,
    });

    expect(result.matchingVersion).toBe('legacy');
    expect(result.breakdown.matchedSkills).toEqual([]);
  });

  it('warns when one side is missing canonical atoms', async () => {
    prismaService.cV.findFirst.mockResolvedValue({
      id: 'cv-6',
      candidateId: 'cand-6',
      skills: ['TypeScript'],
      skillAtoms: [
        {
          raw: 'TypeScript',
          label: 'TypeScript',
          canonical: 'typescript',
          group: null,
          source: 'cv_parsed',
        },
      ],
      parsedData: { summary: 'TypeScript engineer' },
      candidate: { userId: 'candidate-6' },
    });
    prismaService.job.findFirst.mockResolvedValue({
      id: 'job-6',
      recruiterId: 'recruiter-1',
      description: 'Need TypeScript',
      skills: ['TypeScript'],
      skillAtoms: null,
      location: null,
      status: JobStatus.PUBLISHED,
    });

    const result = await service.calculateForCvAndJob('cv-6', 'job-6', {
      sub: 'candidate-6',
      role: UserRole.CANDIDATE,
    });

    expect(result.matchingVersion).toBe('v2');
    expect(result.warnings).toContain(
      'Job canonical skills are missing. Reprocess the JD before relying on this match.',
    );
  });

  it('does not synthesize canonical atoms from legacy skill arrays', async () => {
    prismaService.cV.findFirst.mockResolvedValue({
      id: 'cv-7',
      candidateId: 'cand-7',
      skills: ['AWS: EC2'],
      skillAtoms: null,
      parsedData: { summary: 'Cloud engineer' },
      candidate: { userId: 'candidate-7' },
    });
    prismaService.job.findFirst.mockResolvedValue({
      id: 'job-7',
      recruiterId: 'recruiter-1',
      description: 'Need AWS EC2 experience',
      skills: ['EC2'],
      skillAtoms: null,
      location: null,
      status: JobStatus.PUBLISHED,
    });

    const result = await service.calculateForCvAndJob('cv-7', 'job-7', {
      sub: 'candidate-7',
      role: UserRole.CANDIDATE,
    });

    expect(result.breakdown.matchedSkills).toEqual([]);
    expect(result.skillsScore).toBe(0);
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        'CV canonical skills are missing. Reprocess the CV before relying on this match.',
        'Job canonical skills are missing. Reprocess the JD before relying on this match.',
      ]),
    );
  });
});
