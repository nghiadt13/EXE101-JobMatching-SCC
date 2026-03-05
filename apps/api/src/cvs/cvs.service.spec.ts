import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CvsService } from './cvs.service';
import { PrismaService } from '../prisma/prisma.service';
import { CvStorageService } from './services/cv-storage.service';
import { CvTextExtractorService } from './services/cv-text-extractor.service';
import { CvAiParserService } from './services/cv-ai-parser.service';
import { CvParsingNormalizerService } from './services/cv-parsing-normalizer.service';

describe('CvsService', () => {
  let service: CvsService;
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
          provide: CvStorageService,
          useValue: { save: jest.fn(), remove: jest.fn() },
        },
        {
          provide: CvTextExtractorService,
          useValue: { assertSupported: jest.fn(), extract: jest.fn() },
        },
        { provide: CvAiParserService, useValue: { parse: jest.fn() } },
        {
          provide: CvParsingNormalizerService,
          useValue: { normalize: jest.fn() },
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
});
