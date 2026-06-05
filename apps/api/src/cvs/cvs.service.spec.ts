import {
  BadRequestException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Test, TestingModule } from '@nestjs/testing';
import { CandidateProfileService } from '../matching/services/candidate-profile.service';
import { SkillStorageAdapterService } from '../matching/services/skill-storage-adapter.service';
import { AppLogger } from '../common/logging/app-logger.service';
import { CvsService } from './cvs.service';
import { PrismaService } from '../prisma/prisma.service';
import { CvStorageService } from './services/cv-storage.service';
import { CvTextExtractorService } from './services/cv-text-extractor.service';
import { CreateCvDto } from './dto/create-cv.dto';
import { VectorSyncService } from '../matching/rag/vector-sync.service';
import { CvAiParserService } from './services/cv-ai-parser.service';

describe('CvsService', () => {
  let service: CvsService;
  let cvStorageService: { save: jest.Mock; remove: jest.Mock };
  let cvTextExtractorService: {
    assertSupported: jest.Mock;
    extract: jest.Mock;
  };
  let skillStorageAdapterService: { toStoredSkills: jest.Mock };
  let prismaService: {
    candidate: { findFirst: jest.Mock };
    cV: {
      count: jest.Mock;
      create: jest.Mock;
      findFirst: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    cvStorageService = { save: jest.fn(), remove: jest.fn() };
    cvTextExtractorService = { assertSupported: jest.fn(), extract: jest.fn() };
    skillStorageAdapterService = {
      toStoredSkills: jest.fn((skills: string[]) => ({
        skills,
        skillAtoms: [],
      })),
    };

    prismaService = {
      candidate: { findFirst: jest.fn() },
      cV: {
        count: jest.fn(),
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      $transaction: jest.fn((callback: (tx: unknown) => unknown) =>
        callback({
          cV: {
            update: prismaService.cV.update,
            findFirst: prismaService.cV.findFirst,
            updateMany: prismaService.cV.updateMany,
          },
        }),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CvsService,
        { provide: PrismaService, useValue: prismaService },
        {
          provide: SkillStorageAdapterService,
          useValue: skillStorageAdapterService,
        },
        CandidateProfileService,
        { provide: CvStorageService, useValue: cvStorageService },
        { provide: CvTextExtractorService, useValue: cvTextExtractorService },
        {
          provide: AppLogger,
          useValue: {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
          },
        },
        {
          provide: VectorSyncService,
          useValue: { syncCv: jest.fn().mockResolvedValue(undefined) },
        },
        {
          provide: CvAiParserService,
          useValue: { parseCvInBackground: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<CvsService>(CvsService);
  });

  it('throws when candidate profile missing', async () => {
    prismaService.candidate.findFirst.mockResolvedValue(null);
    await expect(
      service.list('missing-user', { page: 1, limit: 10 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('blocks candidate when cv limit reached', async () => {
    prismaService.candidate.findFirst.mockResolvedValue({ id: 'candidate-1' });
    prismaService.cV.count.mockResolvedValue(10);

    await expect(
      service.upload('candidate-user', {
        originalname: 'cv.pdf',
        mimetype: 'application/pdf',
        size: 100,
        buffer: Buffer.from('content'),
      } as Express.Multer.File),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('fails upload when text extraction fails', async () => {
    prismaService.candidate.findFirst.mockResolvedValue({ id: 'candidate-1' });
    prismaService.cV.count.mockResolvedValue(0);
    cvTextExtractorService.extract.mockRejectedValue(
      new Error('parser failed'),
    );

    try {
      await service.upload('candidate-user', {
        originalname: 'cv.pdf',
        mimetype: 'application/pdf',
        size: 100,
        buffer: Buffer.from('content'),
      } as Express.Multer.File);
      fail('Expected CV upload to fail');
    } catch (error) {
      expect(error).toBeInstanceOf(UnprocessableEntityException);
      expect(
        (error as UnprocessableEntityException).getResponse(),
      ).toMatchObject({
        code: 'CV_PARSE_FAILED',
        details: { stage: 'text_extraction' },
      });
    }

    expect(cvStorageService.save).not.toHaveBeenCalled();
  });

  it('stores uploaded CV raw text without calling AI normalization', async () => {
    prismaService.candidate.findFirst.mockResolvedValue({ id: 'candidate-1' });
    prismaService.cV.count.mockResolvedValue(0);
    cvTextExtractorService.extract.mockResolvedValue('Extracted CV text');
    cvStorageService.save.mockResolvedValue('candidate-1/cv.pdf');
    prismaService.cV.create.mockResolvedValue({
      id: 'cv-1',
      fileName: 'cv.pdf',
      fileSize: 100,
      mimeType: 'application/pdf',
      parsedData: {
        parseStatus: 'pending_apply',
        rawTextLength: 'Extracted CV text'.length,
      },
      skills: [],
      candidateProfile: null,
      candidateProfileVersion: null,
      source: 'upload',
      templateId: 'simple',
      isPrimary: true,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    const result = await service.upload('candidate-user', {
      originalname: 'cv.pdf',
      mimetype: 'application/pdf',
      size: 100,
      buffer: Buffer.from('content'),
    } as Express.Multer.File);

    expect(result.parseStatus).toBe('pending_apply');
    expect(cvStorageService.save).toHaveBeenCalledWith(
      'candidate-1',
      expect.objectContaining({ originalname: 'cv.pdf' }),
    );
    expect(prismaService.cV.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          parsedData: {
            parseStatus: 'pending_apply',
            rawTextLength: 'Extracted CV text'.length,
          },
          rawText: 'Extracted CV text',
          skillAtoms: [],
          candidateProfile: expect.anything(),
        }),
      }),
    );
  });

  it('keeps parsed data, normalized profile, and canonical atoms in sync on manual skill edits', async () => {
    skillStorageAdapterService.toStoredSkills.mockReturnValue({
      skills: ['Docker', 'Kubernetes'],
      skillAtoms: [
        {
          raw: 'Docker',
          label: 'Docker',
          canonical: 'docker',
          group: null,
          source: 'cv_manual',
        },
        {
          raw: 'Kubernetes',
          label: 'Kubernetes',
          canonical: 'kubernetes',
          group: null,
          source: 'cv_manual',
        },
      ],
    });
    prismaService.candidate.findFirst.mockResolvedValue({ id: 'candidate-1' });
    prismaService.cV.findFirst.mockResolvedValue({
      id: 'cv-1',
      candidateId: 'candidate-1',
      isPrimary: true,
      filePath: 'candidate-1/file.pdf',
      parsedData: {
        summary: 'Existing summary',
        normalizedProfile: {
          summary: 'Existing summary',
          skills: ['TypeScript'],
          languages: ['English'],
        },
      },
    });
    prismaService.cV.update.mockResolvedValue({
      id: 'cv-1',
      fileName: 'cv.pdf',
      fileSize: 100,
      mimeType: 'application/pdf',
      parsedData: {
        summary: 'Existing summary',
        normalizedProfile: {
          summary: 'Existing summary',
          skills: ['Docker', 'Kubernetes'],
          languages: ['English'],
        },
      },
      skills: ['Docker', 'Kubernetes'],
      isPrimary: true,
      createdAt: new Date('2026-03-06T00:00:00.000Z'),
      updatedAt: new Date('2026-03-06T00:00:00.000Z'),
      filePath: 'candidate-1/file.pdf',
    });

    await service.update('candidate-user', 'cv-1', {
      skills: ['Docker', 'Kubernetes'],
    });

    const updateCalls = prismaService.cV.update.mock.calls as Array<
      [
        {
          data: {
            parsedData: {
              skills: string[];
              normalizedProfile: { skills: string[] };
            };
            skills: string[];
            skillAtoms: Array<{ canonical: string }>;
          };
        },
      ]
    >;
    expect(updateCalls[0]?.[0].data.parsedData.skills).toEqual([
      'Docker',
      'Kubernetes',
    ]);
    expect(
      updateCalls[0]?.[0].data.parsedData.normalizedProfile.skills,
    ).toEqual(['Docker', 'Kubernetes']);
    expect(updateCalls[0]?.[0].data.skills).toEqual(['Docker', 'Kubernetes']);
    expect(updateCalls[0]?.[0].data.skillAtoms).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ canonical: 'docker' }),
        expect.objectContaining({ canonical: 'kubernetes' }),
      ]),
    );
  });

  describe('designTokens mapping', () => {
    const baseDto: CreateCvDto = {
      templateId: 'simple',
      profile: { name: 'Test User' },
      experience: [],
      education: [],
      skills: [],
      projects: [],
      certifications: [],
      languages: [],
    };

    const validTokens = {
      fontFamily: 'Inter, sans-serif',
      fontSize: 12,
      lineHeight: 1.5,
      primaryColor: '#0f172a',
      pageMargin: 40,
    };

    // Reach the private builder via index access; it is a deterministic pure
    // mapper so wiring up the full `updateBuilderCv` path is unnecessary for
    // verifying the round-trip semantics required by 7.7 / 7.9.
    type ParsedDataShape = {
      builderData: { designTokens?: unknown };
    };
    const callBuilder = (dto: CreateCvDto): ParsedDataShape =>
      (
        service as unknown as {
          buildNormalizedParsedData: (d: CreateCvDto) => ParsedDataShape;
        }
      ).buildNormalizedParsedData(dto);

    it('writes designTokens into parsedData.builderData when provided', () => {
      const parsed = callBuilder({ ...baseDto, designTokens: validTokens });

      expect(parsed.builderData.designTokens).toEqual(validTokens);
    });

    it('preserves undefined when designTokens is absent on the DTO', () => {
      const parsed = callBuilder({ ...baseDto });

      // Per design.md: server preserves `undefined` rather than coercing to
      // DEFAULT_DESIGN_TOKENS so the frontend default kicks in on read.
      expect(parsed.builderData.designTokens).toBeUndefined();
    });
  });
});

describe('CreateCvDto designTokens validation', () => {
  const baseDtoPlain = {
    templateId: 'simple',
    profile: { name: 'Test User' },
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    languages: [],
  };

  const validTokens = {
    fontFamily: 'Inter, sans-serif',
    fontSize: 12,
    lineHeight: 1.5,
    primaryColor: '#0f172a',
    pageMargin: 40,
  };

  // Locate the validation error nested under `designTokens.<field>` regardless
  // of how class-validator structures its children list across versions.
  const findDesignTokenFieldErrors = (
    errors: Awaited<ReturnType<typeof validate>>,
    field: string,
  ) => {
    const top = errors.find((e) => e.property === 'designTokens');
    if (!top) return [];
    const nested = (top.children ?? []).find((c) => c.property === field);
    return nested?.constraints ? Object.keys(nested.constraints) : [];
  };

  it('accepts in-range designTokens', async () => {
    const dto = plainToInstance(CreateCvDto, {
      ...baseDtoPlain,
      designTokens: validTokens,
    });

    const errors = await validate(dto, { whitelist: true });

    expect(errors).toEqual([]);
  });

  it('rejects fontSize above max=16', async () => {
    const dto = plainToInstance(CreateCvDto, {
      ...baseDtoPlain,
      designTokens: { ...validTokens, fontSize: 99 },
    });

    const errors = await validate(dto, { whitelist: true });
    const constraints = findDesignTokenFieldErrors(errors, 'fontSize');

    expect(constraints).toContain('max');
  });

  it('rejects lineHeight above max=2.0', async () => {
    const dto = plainToInstance(CreateCvDto, {
      ...baseDtoPlain,
      designTokens: { ...validTokens, lineHeight: 5.0 },
    });

    const errors = await validate(dto, { whitelist: true });
    const constraints = findDesignTokenFieldErrors(errors, 'lineHeight');

    expect(constraints).toContain('max');
  });

  it('rejects pageMargin above max=60', async () => {
    const dto = plainToInstance(CreateCvDto, {
      ...baseDtoPlain,
      designTokens: { ...validTokens, pageMargin: 1000 },
    });

    const errors = await validate(dto, { whitelist: true });
    const constraints = findDesignTokenFieldErrors(errors, 'pageMargin');

    expect(constraints).toContain('max');
  });
});
