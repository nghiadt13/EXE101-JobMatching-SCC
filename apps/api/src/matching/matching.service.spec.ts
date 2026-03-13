import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JobStatus, UserRole } from '@prisma/client';
import { CandidateProfileService } from './services/candidate-profile.service';
import { JobRequirementsSchemaService } from './services/job-requirements-schema.service';
import { SchemaMatchingEvaluatorService } from './services/schema-matching-evaluator.service';
import { PrismaService } from '../prisma/prisma.service';
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
        JobRequirementsSchemaService,
        CandidateProfileService,
        SchemaMatchingEvaluatorService,
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    service = module.get<MatchingService>(MatchingService);
  });

  it('returns schema_v1 snapshot for candidate own cv and published job', async () => {
    prismaService.cV.findFirst.mockResolvedValue({
      id: 'cv-1',
      candidateId: 'cand-1',
      skills: ['TypeScript', 'NestJS'],
      candidateProfile: null,
      parsedData: {
        summary: 'Backend developer with NestJS',
        normalizedProfile: {
          title: 'Backend Engineer',
          summary: 'Backend developer with NestJS',
          skills: ['TypeScript', 'NestJS'],
          experience: [
            {
              role: 'Backend Engineer',
              company: 'ACME',
              startDate: '2022-01',
              endDate: '2025-01',
              tech: ['TypeScript', 'NestJS'],
            },
          ],
          education: [],
          certifications: [],
          projects: [],
          languages: ['English'],
          location: { city: 'Hanoi', country: 'Vietnam' },
          rawQuality: { score: 90, needsManualReview: false, reason: '' },
        },
      },
      candidate: { userId: 'candidate-1' },
    });
    prismaService.job.findFirst.mockResolvedValue({
      id: 'job-1',
      recruiterId: 'recruiter-1',
      title: 'Backend Engineer',
      description: 'Need a TypeScript backend engineer with NestJS.',
      skills: ['TypeScript', 'NestJS', 'Docker'],
      requirementsSchema: null,
      location: null,
      status: JobStatus.PUBLISHED,
    });

    const result = await service.calculateForCvAndJob('cv-1', 'job-1', {
      sub: 'candidate-1',
      role: UserRole.CANDIDATE,
    });

    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.matchingVersion).toBe('schema_v1');
    expect(result.matchingSnapshot.version).toBe('schema_v1');
    expect(result.matchingSnapshot.requirements.length).toBeGreaterThan(0);
  });

  it('throws not found when candidate tries foreign cv', async () => {
    prismaService.cV.findFirst.mockResolvedValue({
      id: 'cv-2',
      candidateId: 'cand-2',
      skills: [],
      candidateProfile: null,
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
      candidateProfile: null,
      parsedData: {},
      candidate: { userId: 'candidate-1' },
    });
    prismaService.job.findFirst.mockResolvedValue({
      id: 'job-draft',
      recruiterId: 'recruiter-1',
      title: 'Draft role',
      description: 'Draft only',
      skills: ['Hiring'],
      requirementsSchema: null,
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
      candidateProfile: null,
      parsedData: { summary: 'Recruiting specialist' },
      candidate: { userId: 'candidate-3' },
    });
    prismaService.job.findFirst.mockResolvedValue({
      id: 'job-2',
      recruiterId: 'recruiter-1',
      title: 'Recruiter',
      description: 'Need sourcing and communication',
      skills: ['Sourcing'],
      requirementsSchema: null,
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

  it('surfaces manual review warnings from CV and JD normalized metadata', async () => {
    prismaService.cV.findFirst.mockResolvedValue({
      id: 'cv-4',
      candidateId: 'cand-4',
      skills: ['TypeScript'],
      candidateProfile: null,
      parsedData: {
        normalizedProfile: {
          skills: ['TypeScript', 'Docker'],
          rawQuality: {
            score: 40,
            needsManualReview: true,
            reason: 'weak text',
          },
        },
        summary: 'Backend engineer with Docker experience',
      },
      candidate: { userId: 'candidate-4' },
    });
    prismaService.job.findFirst.mockResolvedValue({
      id: 'job-uploaded',
      recruiterId: 'recruiter-1',
      title: 'Imported draft',
      description: 'Imported draft job',
      skills: [],
      requirementsSchema: null,
      location: {
        __normalization: {
          normalizedProfile: {
            skills: ['Docker', 'Kubernetes'],
            rawQuality: {
              score: 45,
              needsManualReview: true,
              reason: 'weak jd',
            },
          },
        },
      },
      status: JobStatus.PUBLISHED,
    });

    const result = await service.calculateForCvAndJob('cv-4', 'job-uploaded', {
      sub: 'candidate-4',
      role: UserRole.CANDIDATE,
    });

    expect(result.matchingVersion).toBe('schema_v1');
    expect(result.warnings).toContain('CV parsing needs manual review');
    expect(result.warnings).toContain('Job parsing needs manual review');
  });
});
