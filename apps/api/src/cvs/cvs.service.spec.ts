import {
  BadRequestException,
  NotFoundException,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { AiNormalizationError } from '../normalization/normalization.errors';
import { Test, TestingModule } from '@nestjs/testing';
import { SkillStorageAdapterService } from '../matching/services/skill-storage-adapter.service';
import { AppLogger } from '../common/logging/app-logger.service';
import { CvsService } from './cvs.service';
import { PrismaService } from '../prisma/prisma.service';
import { AiNormalizationService } from '../normalization/ai-normalization.service';
import { CvStorageService } from './services/cv-storage.service';
import { CvTextExtractorService } from './services/cv-text-extractor.service';

describe('CvsService', () => {
  let service: CvsService;
  let cvStorageService: { save: jest.Mock; remove: jest.Mock };
  let cvTextExtractorService: {
    assertSupported: jest.Mock;
    extract: jest.Mock;
  };
  let aiNormalizationService: {
    normalizeCv: jest.Mock;
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
    aiNormalizationService = {
      normalizeCv: jest.fn(),
    };
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
        { provide: AiNormalizationService, useValue: aiNormalizationService },
        {
          provide: SkillStorageAdapterService,
          useValue: skillStorageAdapterService,
        },
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
        details: { stage: 'document_processing' },
      });
    }

    expect(cvStorageService.save).not.toHaveBeenCalled();
  });

  it('fails upload when normalization fails after extraction succeeds', async () => {
    prismaService.candidate.findFirst.mockResolvedValue({ id: 'candidate-1' });
    prismaService.cV.count.mockResolvedValue(0);
    cvTextExtractorService.extract.mockResolvedValue('Extracted CV text');
    aiNormalizationService.normalizeCv.mockRejectedValue(
      new Error('llm failed'),
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
        details: {
          stage: 'document_processing',
        },
      });
    }

    expect(aiNormalizationService.normalizeCv).toHaveBeenCalledWith(
      'Extracted CV text',
    );
    expect(cvStorageService.save).not.toHaveBeenCalled();
  });

  it('returns service unavailable when AI provider is unavailable', async () => {
    prismaService.candidate.findFirst.mockResolvedValue({ id: 'candidate-1' });
    prismaService.cV.count.mockResolvedValue(0);
    cvTextExtractorService.extract.mockResolvedValue('Extracted CV text');
    aiNormalizationService.normalizeCv.mockRejectedValue(
      new AiNormalizationError('service_unavailable', 'provider down'),
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
      expect(error).toBeInstanceOf(ServiceUnavailableException);
      expect(
        (error as ServiceUnavailableException).getResponse(),
      ).toMatchObject({
        code: 'AI_SERVICE_UNAVAILABLE',
        details: { stage: 'normalization' },
      });
    }
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
});
