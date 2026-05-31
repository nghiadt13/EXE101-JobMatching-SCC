import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JobStatus, UserRole } from '@prisma/client';
import { readFile } from 'node:fs/promises';
import { DocumentStorageService } from '../documents/services/document-storage.service';
import { DocumentTextExtractorService } from '../documents/services/document-text-extractor.service';
import { PrismaService } from '../prisma/prisma.service';
import { MatchingService } from './matching.service';
import { CandidateProfileService } from './services/candidate-profile.service';
import { JdDrivenEvaluationService } from './services/jd-driven-evaluation.service';
import { JobRequirementsSchemaService } from './services/job-requirements-schema.service';
import { SchemaMatchingEvaluatorService } from './services/schema-matching-evaluator.service';
import {
  MATCHING_SNAPSHOT_V2,
  REQUIREMENTS_SCHEMA_VERSION,
  REQUIREMENTS_SCHEMA_V2,
  RequirementsSchemaV1,
  RequirementsSchemaV2,
} from './types/schema-matching.types';

jest.mock('node:fs/promises', () => ({
  readFile: jest.fn(),
}));

const mockedReadFile = readFile as jest.MockedFunction<typeof readFile>;

describe('MatchingService', () => {
  let service: MatchingService;
  let prismaService: {
    cV: { findFirst: jest.Mock };
    job: { findFirst: jest.Mock };
  };
  let jdDrivenEvaluationService: { evaluate: jest.Mock };
  let documentStorageService: { getAbsolutePath: jest.Mock };
  let documentTextExtractorService: { extract: jest.Mock };

  beforeEach(async () => {
    prismaService = {
      cV: { findFirst: jest.fn() },
      job: { findFirst: jest.fn() },
    };
    jdDrivenEvaluationService = {
      evaluate: jest.fn().mockResolvedValue({
        finalScorePercent: 82,
        snapshot: {
          version: MATCHING_SNAPSHOT_V2,
          scoreBreakdown: {
            skillScore: 80,
            constraintScore: 100,
            experienceBonus: 70,
            projectBonus: 70,
            final: 82,
          },
          requirements: [],
          constraints: [],
          candidateSummary: candidateSummary(),
          strengths: [],
          gaps: [],
          constraintsFailed: [],
          warnings: [],
        },
      }),
    };
    documentStorageService = {
      getAbsolutePath: jest.fn().mockReturnValue('C:\\uploads\\legacy.pdf'),
    };
    documentTextExtractorService = {
      extract: jest.fn().mockResolvedValue('fallback extracted cv text'),
    };
    mockedReadFile.mockResolvedValue(Buffer.from('legacy pdf'));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchingService,
        JobRequirementsSchemaService,
        CandidateProfileService,
        SchemaMatchingEvaluatorService,
        { provide: PrismaService, useValue: prismaService },
        {
          provide: JdDrivenEvaluationService,
          useValue: jdDrivenEvaluationService,
        },
        { provide: DocumentStorageService, useValue: documentStorageService },
        {
          provide: DocumentTextExtractorService,
          useValue: documentTextExtractorService,
        },
      ],
    }).compile();

    service = module.get<MatchingService>(MatchingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('keeps the legacy schema_v1 path for stored V1 requirements', async () => {
    prismaService.cV.findFirst.mockResolvedValue(
      cvRecord({
        skills: ['TypeScript', 'NestJS'],
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
      }),
    );
    prismaService.job.findFirst.mockResolvedValue(
      jobRecord({ requirementsSchema: requirementsSchemaV1() }),
    );

    const result = await service.calculateForCvAndJob('cv-1', 'job-1', {
      sub: 'candidate-1',
      role: UserRole.CANDIDATE,
    });

    const snapshot = result.matchingSnapshot as {
      version: string;
      requirements: unknown[];
    };
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.matchingVersion).toBe('schema_v1');
    expect(snapshot.version).toBe('schema_v1');
    expect(snapshot.requirements.length).toBeGreaterThan(0);
    expect(jdDrivenEvaluationService.evaluate).not.toHaveBeenCalled();
  });

  it('uses schema_v2 evaluation with stored CV raw text and avoids file fallback', async () => {
    prismaService.cV.findFirst.mockResolvedValue(
      cvRecord({ rawText: 'raw cv with TypeScript and NestJS' }),
    );
    prismaService.job.findFirst.mockResolvedValue(
      jobRecord({ requirementsSchema: requirementsSchemaV2() }),
    );

    const result = await service.calculateForCvAndJob('cv-1', 'job-1', {
      sub: 'candidate-1',
      role: UserRole.CANDIDATE,
    });

    expect(result.matchingVersion).toBe('schema_v2');
    expect(result.score).toBe(82);
    expect(jdDrivenEvaluationService.evaluate).toHaveBeenCalledWith({
      cvRawText: 'raw cv with TypeScript and NestJS',
      requirementsSchema: requirementsSchemaV2(),
    });
    expect(mockedReadFile).not.toHaveBeenCalled();
    expect(documentTextExtractorService.extract).not.toHaveBeenCalled();
  });

  it('extracts legacy CV files on the fly when raw text is missing', async () => {
    prismaService.cV.findFirst.mockResolvedValue(
      cvRecord({ rawText: null, filePath: 'candidate/legacy.pdf' }),
    );
    prismaService.job.findFirst.mockResolvedValue(
      jobRecord({ requirementsSchema: requirementsSchemaV2() }),
    );

    await service.calculateForCvAndJob('cv-1', 'job-1', {
      sub: 'candidate-1',
      role: UserRole.CANDIDATE,
    });

    expect(documentStorageService.getAbsolutePath).toHaveBeenCalledWith(
      'cvs',
      'candidate/legacy.pdf',
    );
    expect(mockedReadFile).toHaveBeenCalledWith('C:\\uploads\\legacy.pdf');
    expect(documentTextExtractorService.extract).toHaveBeenCalledWith(
      expect.objectContaining({
        mimetype: 'application/pdf',
        originalname: 'candidate/legacy.pdf',
      }),
      'CV fallback',
    );
    expect(jdDrivenEvaluationService.evaluate).toHaveBeenCalledWith(
      expect.objectContaining({
        cvRawText: 'fallback extracted cv text',
      }),
    );
  });

  it('throws not found when candidate tries foreign cv', async () => {
    prismaService.cV.findFirst.mockResolvedValue(
      cvRecord({ candidate: { userId: 'candidate-2' } }),
    );

    await expect(
      service.calculateForCvAndJob('cv-2', 'job-1', {
        sub: 'candidate-1',
        role: UserRole.CANDIDATE,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prismaService.job.findFirst).not.toHaveBeenCalled();
  });

  it('throws not found when candidate tries non-published job', async () => {
    prismaService.cV.findFirst.mockResolvedValue(cvRecord());
    prismaService.job.findFirst.mockResolvedValue(
      jobRecord({ status: JobStatus.DRAFT }),
    );

    await expect(
      service.calculateForCvAndJob('cv-1', 'job-draft', {
        sub: 'candidate-1',
        role: UserRole.CANDIDATE,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('allows recruiter to calculate against own draft job', async () => {
    prismaService.cV.findFirst.mockResolvedValue(
      cvRecord({
        candidate: { userId: 'candidate-3' },
        skills: ['Sourcing'],
        parsedData: { summary: 'Recruiting specialist' },
      }),
    );
    prismaService.job.findFirst.mockResolvedValue(
      jobRecord({
        id: 'job-2',
        recruiterId: 'recruiter-1',
        title: 'Recruiter',
        description: 'Need sourcing and communication',
        skills: ['Sourcing'],
        requirementsSchema: requirementsSchemaV1({
          label: 'Sourcing',
          keywords: ['sourcing'],
        }),
        status: JobStatus.DRAFT,
      }),
    );

    const result = await service.calculateForCvAndJob('cv-3', 'job-2', {
      sub: 'recruiter-1',
      role: UserRole.RECRUITER,
    });

    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.matchingVersion).toBe('schema_v1');
  });

  it('surfaces manual review warnings from CV and JD normalized metadata', async () => {
    prismaService.cV.findFirst.mockResolvedValue(
      cvRecord({
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
      }),
    );
    prismaService.job.findFirst.mockResolvedValue(
      jobRecord({
        id: 'job-uploaded',
        title: 'Imported draft',
        description: 'Imported draft job',
        skills: [],
        requirementsSchema: requirementsSchemaV1({
          label: 'Docker',
          keywords: ['docker'],
        }),
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
      }),
    );

    const result = await service.calculateForCvAndJob('cv-4', 'job-uploaded', {
      sub: 'candidate-1',
      role: UserRole.CANDIDATE,
    });

    expect(result.matchingVersion).toBe('schema_v1');
    expect(result.warnings).toContain('CV parsing needs manual review');
    expect(result.warnings).toContain('Job parsing needs manual review');
  });
});

function cvRecord(
  overrides: Partial<{
    id: string;
    candidateId: string;
    skills: string[];
    candidateProfile: unknown;
    parsedData: unknown;
    rawText: string | null;
    filePath: string;
    candidate: { userId: string };
  }> = {},
) {
  return {
    id: 'cv-1',
    candidateId: 'cand-1',
    skills: ['TypeScript', 'NestJS'],
    candidateProfile: null,
    parsedData: {},
    rawText: 'raw cv text',
    filePath: 'candidate/cv.pdf',
    candidate: { userId: 'candidate-1' },
    ...overrides,
  };
}

function jobRecord(
  overrides: Partial<{
    id: string;
    recruiterId: string;
    title: string;
    description: string;
    skills: string[];
    requirementsSchema: unknown;
    location: unknown;
    status: JobStatus;
  }> = {},
) {
  return {
    id: 'job-1',
    recruiterId: 'recruiter-1',
    title: 'Backend Engineer',
    description: 'Need a TypeScript backend engineer with NestJS.',
    skills: ['TypeScript', 'NestJS', 'Docker'],
    requirementsSchema: null,
    location: null,
    status: JobStatus.PUBLISHED,
    ...overrides,
  };
}

function requirementsSchemaV1(
  requirement: { label: string; keywords: string[] } = {
    label: 'TypeScript',
    keywords: ['typescript'],
  },
): RequirementsSchemaV1 {
  return {
    version: REQUIREMENTS_SCHEMA_VERSION,
    roleTitle: 'Backend Engineer',
    summary: 'Backend role',
    mustHaves: [
      {
        id: `must-have-skill-${requirement.keywords[0]}`,
        label: requirement.label,
        category: 'skill',
        importance: 'must_have',
        keywords: requirement.keywords,
        minimumMonths: null,
      },
    ],
    niceToHaves: [],
    locationPreference: null,
    warnings: [],
  };
}

function requirementsSchemaV2(): RequirementsSchemaV2 {
  return {
    version: REQUIREMENTS_SCHEMA_V2,
    roleTitle: 'Backend Engineer',
    summary: 'Backend role',
    requirements: [
      {
        id: 'critical-skill-typescript',
        label: 'TypeScript',
        category: 'skill',
        importance: 'critical',
        keywords: ['typescript'],
        minimumMonths: null,
      },
    ],
    constraints: [],
    locationPreference: null,
    warnings: [],
  };
}

function candidateSummary() {
  return {
    headline: 'Backend Engineer',
    totalExperienceMonths: 36,
    relevantExperienceMonths: 24,
    skills: ['TypeScript'],
    location: null,
    projectRelevance: {
      totalProjects: 1,
      relevantProjects: 1,
      relevanceScore: 70,
      highlights: ['Built a TypeScript API'],
    },
  };
}
