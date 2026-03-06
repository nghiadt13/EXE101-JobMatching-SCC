import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  CV_MAX_ACTIVE_PER_CANDIDATE,
  CV_MAX_FILE_SIZE_BYTES,
  CV_MAX_TEXT_CHARS,
} from './cvs.constants';
import { QueryCvsDto } from './dto/query-cvs.dto';
import { UpdateCvDto } from './dto/update-cv.dto';
import { CvView, CvsListResponse } from './cvs.types';
import { PrismaService } from '../prisma/prisma.service';
import { CvStorageService } from './services/cv-storage.service';
import { CvTextExtractorService } from './services/cv-text-extractor.service';
import { CvAiParserService } from './services/cv-ai-parser.service';
import { CvParsingNormalizerService } from './services/cv-parsing-normalizer.service';

@Injectable()
export class CvsService {
  private readonly logger = new Logger(CvsService.name);
  private readonly parseFallbackSummary =
    'CV uploaded successfully, but auto-parsing could not read the content. Please update summary and skills manually.';

  constructor(
    private readonly prisma: PrismaService,
    private readonly cvStorageService: CvStorageService,
    private readonly cvTextExtractorService: CvTextExtractorService,
    private readonly cvAiParserService: CvAiParserService,
    private readonly cvParsingNormalizerService: CvParsingNormalizerService,
  ) {}

  async upload(userId: string, file: Express.Multer.File): Promise<CvView> {
    if (!file) {
      throw new BadRequestException('CV file is required');
    }
    if (file.size > CV_MAX_FILE_SIZE_BYTES) {
      throw new PayloadTooLargeException('CV file is too large');
    }
    this.cvTextExtractorService.assertSupported(file);

    const candidate = await this.getCandidateOrThrow(userId);
    const activeCount = await this.prisma.cV.count({
      where: { candidateId: candidate.id, deletedAt: null },
    });
    if (activeCount >= CV_MAX_ACTIVE_PER_CANDIDATE) {
      throw new BadRequestException('CV limit reached for candidate');
    }

    const normalized = await this.buildNormalizedCvData(file);

    const storedPath = await this.cvStorageService.save(candidate.id, file);
    try {
      const created = await this.prisma.cV.create({
        data: {
          candidateId: candidate.id,
          fileName: file.originalname,
          filePath: storedPath,
          fileSize: file.size,
          mimeType: file.mimetype,
          parsedData: normalized.parsedData as unknown as Prisma.InputJsonValue,
          skills: normalized.skills as Prisma.InputJsonValue,
          isPrimary: activeCount === 0,
        },
        select: this.cvViewSelect,
      });
      return this.toView(created);
    } catch (error) {
      await this.cvStorageService.remove(storedPath);
      throw error;
    }
  }

  private async buildNormalizedCvData(file: Express.Multer.File) {
    try {
      const text = (await this.cvTextExtractorService.extract(file)).slice(
        0,
        CV_MAX_TEXT_CHARS,
      );
      const aiPayload = await this.cvAiParserService.parse(text);
      return this.cvParsingNormalizerService.normalize(aiPayload, text);
    } catch (error) {
      this.logger.warn(
        `CV parse fallback used for "${file.originalname}": ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
      return this.cvParsingNormalizerService.normalize(
        {
          skills: [],
          summary: this.parseFallbackSummary,
          experience: [],
          education: [],
          contact: {},
        },
        this.parseFallbackSummary,
      );
    }
  }

  async list(userId: string, query: QueryCvsDto): Promise<CvsListResponse> {
    const candidate = await this.getCandidateOrThrow(userId);
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where: Prisma.CVWhereInput = {
      candidateId: candidate.id,
      deletedAt: null,
      ...(query.search
        ? { fileName: { contains: query.search, mode: 'insensitive' } }
        : {}),
    };

    const [items, totalItems] = await Promise.all([
      this.prisma.cV.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: this.cvViewSelect,
      }),
      this.prisma.cV.count({ where }),
    ]);

    return {
      items: items.map((item) => this.toView(item)),
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / limit)),
      },
    };
  }

  async getById(userId: string, cvId: string): Promise<CvView> {
    const candidate = await this.getCandidateOrThrow(userId);
    const cv = await this.prisma.cV.findFirst({
      where: {
        id: cvId,
        candidateId: candidate.id,
        deletedAt: null,
      },
      select: this.cvViewSelect,
    });
    if (!cv) {
      throw new NotFoundException('CV not found');
    }

    return this.toView(cv);
  }

  async update(
    userId: string,
    cvId: string,
    dto: UpdateCvDto,
  ): Promise<CvView> {
    const candidate = await this.getCandidateOrThrow(userId);
    await this.ensureCvOwnership(candidate.id, cvId);

    const normalizedSkills = dto.skills
      ?.map((item) => item.trim())
      .filter(Boolean);
    const updated = await this.prisma.cV.update({
      where: { id: cvId },
      data: {
        ...(dto.parsedData !== undefined
          ? { parsedData: dto.parsedData as Prisma.InputJsonValue }
          : {}),
        ...(normalizedSkills !== undefined
          ? { skills: normalizedSkills as Prisma.InputJsonValue }
          : {}),
      },
      select: this.cvViewSelect,
    });

    return this.toView(updated);
  }

  async softDelete(userId: string, cvId: string): Promise<{ success: true }> {
    const candidate = await this.getCandidateOrThrow(userId);
    const target = await this.ensureCvOwnership(candidate.id, cvId);

    await this.prisma.$transaction(async (transaction) => {
      await transaction.cV.update({
        where: { id: cvId },
        data: {
          deletedAt: new Date(),
          isPrimary: false,
        },
      });

      if (target.isPrimary) {
        const fallback = await transaction.cV.findFirst({
          where: {
            candidateId: candidate.id,
            deletedAt: null,
            id: { not: cvId },
          },
          orderBy: { createdAt: 'desc' },
          select: { id: true },
        });

        if (fallback) {
          await transaction.cV.update({
            where: { id: fallback.id },
            data: { isPrimary: true },
          });
        }
      }
    });

    await this.cvStorageService.remove(target.filePath);
    return { success: true };
  }

  async setPrimary(userId: string, cvId: string): Promise<CvView> {
    const candidate = await this.getCandidateOrThrow(userId);
    await this.ensureCvOwnership(candidate.id, cvId);

    await this.prisma.$transaction(async (transaction) => {
      await transaction.cV.updateMany({
        where: {
          candidateId: candidate.id,
          deletedAt: null,
        },
        data: { isPrimary: false },
      });

      await transaction.cV.update({
        where: { id: cvId },
        data: { isPrimary: true },
      });
    });

    return this.getById(userId, cvId);
  }

  private async getCandidateOrThrow(userId: string): Promise<{ id: string }> {
    const candidate = await this.prisma.candidate.findFirst({
      where: {
        userId,
        user: {
          deletedAt: null,
        },
      },
      select: { id: true },
    });
    if (!candidate) {
      throw new NotFoundException('Candidate profile not found');
    }
    return candidate;
  }

  private async ensureCvOwnership(
    candidateId: string,
    cvId: string,
  ): Promise<{ isPrimary: boolean; filePath: string }> {
    const cv = await this.prisma.cV.findFirst({
      where: {
        id: cvId,
        candidateId,
        deletedAt: null,
      },
      select: {
        id: true,
        isPrimary: true,
        filePath: true,
      },
    });

    if (!cv) {
      throw new NotFoundException('CV not found');
    }

    return cv;
  }

  private toView(item: {
    id: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    parsedData: Prisma.JsonValue;
    skills: Prisma.JsonValue;
    isPrimary: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): CvView {
    return {
      id: item.id,
      fileName: item.fileName,
      fileSize: item.fileSize,
      mimeType: item.mimeType,
      parsedData:
        (item.parsedData as unknown as CvView['parsedData']) ??
        ({} as CvView['parsedData']),
      skills: Array.isArray(item.skills) ? (item.skills as string[]) : [],
      isPrimary: item.isPrimary,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  private get cvViewSelect() {
    return {
      id: true,
      fileName: true,
      fileSize: true,
      mimeType: true,
      parsedData: true,
      skills: true,
      isPrimary: true,
      createdAt: true,
      updatedAt: true,
      filePath: true,
    } satisfies Prisma.CVSelect;
  }
}
