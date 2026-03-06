import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
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
  let aiNormalizationService: { normalizeCv: jest.Mock };
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
    aiNormalizationService = { normalizeCv: jest.fn() };

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
        { provide: CvStorageService, useValue: cvStorageService },
        { provide: CvTextExtractorService, useValue: cvTextExtractorService },
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

  it('uses fallback parsed data when text extraction fails', async () => {
    prismaService.candidate.findFirst.mockResolvedValue({ id: 'candidate-1' });
    prismaService.cV.count.mockResolvedValue(0);
    cvTextExtractorService.extract.mockRejectedValue(
      new Error('parser failed'),
    );
    aiNormalizationService.normalizeCv.mockResolvedValue({
      schemaVersion: 'candidate_job_profile_v1',
      status: 'fallback',
      profile: {
        schemaVersion: 'candidate_job_profile_v1',
        language: 'en',
        title: 'Unstructured candidate profile',
        summary:
          'CV uploaded successfully, but auto-parsing could not read the content. Please update summary and skills manually.',
        skills: [],
        experience: [],
        education: [],
        certifications: [],
        projects: [],
        languages: [],
        location: { city: '', country: '' },
        rawQuality: { score: 45, needsManualReview: true, reason: 'fallback' },
      },
      telemetry: { source: 'fallback', fallbackUsed: true, latencyMs: 10 },
    });
    cvStorageService.save.mockResolvedValue('candidate-1/file.pdf');
    prismaService.cV.create.mockResolvedValue({
      id: 'cv-1',
      fileName: 'cv.pdf',
      fileSize: 100,
      mimeType: 'application/pdf',
      parsedData: {
        skills: [],
        experience: [],
        education: [],
        contact: {},
        summary:
          'CV uploaded successfully, but auto-parsing could not read the content. Please update summary and skills manually.',
      },
      skills: [],
      isPrimary: true,
      createdAt: new Date('2026-03-06T00:00:00.000Z'),
      updatedAt: new Date('2026-03-06T00:00:00.000Z'),
      filePath: 'candidate-1/file.pdf',
    });

    const result = await service.upload('candidate-user', {
      originalname: 'cv.pdf',
      mimetype: 'application/pdf',
      size: 100,
      buffer: Buffer.from('content'),
    } as Express.Multer.File);

    expect(aiNormalizationService.normalizeCv).toHaveBeenCalledWith(
      'CV uploaded successfully, but auto-parsing could not read the content. Please update summary and skills manually.',
    );
    expect(result.id).toBe('cv-1');
    expect(result.skills).toEqual([]);
  });
});
