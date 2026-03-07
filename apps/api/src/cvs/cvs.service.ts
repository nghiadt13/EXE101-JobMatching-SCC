import {
  BadRequestException,
  HttpException,
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
  ServiceUnavailableException,
  UnprocessableEntityException,
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
import { CandidateProfileService } from '../matching/services/candidate-profile.service';
import { SkillStorageAdapterService } from '../matching/services/skill-storage-adapter.service';
import { PrismaService } from '../prisma/prisma.service';
import { AiNormalizationService } from '../normalization/ai-normalization.service';
import { AiNormalizationError } from '../normalization/normalization.errors';
import { buildErrorPayload } from '../common/errors/api-error-envelope';
import { ERROR_CODES } from '../common/errors/error-codes';
import { AppLogger } from '../common/logging/app-logger.service';
import {
  NormalizationResult,
  NormalizedProfile,
  ParseStatus,
} from '../normalization/normalization.types';
import { CvStorageService } from './services/cv-storage.service';
import { CvTextExtractorService } from './services/cv-text-extractor.service';

@Injectable()
export class CvsService {
  constructor(
    private readonly logger: AppLogger,
    private readonly prisma: PrismaService,
    private readonly aiNormalizationService: AiNormalizationService,
    private readonly cvStorageService: CvStorageService,
    private readonly cvTextExtractorService: CvTextExtractorService,
    private readonly candidateProfileService: CandidateProfileService,
    private readonly skillStorageAdapter: SkillStorageAdapterService,
  ) {}

  async upload(userId: string, file: Express.Multer.File): Promise<CvView> {
    if (!file) {
      throw new BadRequestException(
        buildErrorPayload(ERROR_CODES.cvFileRequired, 'CV file is required'),
      );
    }
    if (file.size > CV_MAX_FILE_SIZE_BYTES) {
      throw new PayloadTooLargeException(
        buildErrorPayload(ERROR_CODES.cvFileTooLarge, 'CV file is too large'),
      );
    }
    this.cvTextExtractorService.assertSupported(file);

    const candidate = await this.getCandidateOrThrow(userId);
    const activeCount = await this.prisma.cV.count({
      where: { candidateId: candidate.id, deletedAt: null },
    });
    if (activeCount >= CV_MAX_ACTIVE_PER_CANDIDATE) {
      throw new BadRequestException(
        buildErrorPayload(
          ERROR_CODES.cvLimitReached,
          'CV limit reached for candidate',
        ),
      );
    }

    this.logger.info('cv_upload_started', {
      actorId: userId,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      candidateId: candidate.id,
    });

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
          skillAtoms: normalized.skillAtoms as unknown as Prisma.InputJsonValue,
          candidateProfile:
            normalized.candidateProfile as unknown as Prisma.InputJsonValue,
          candidateProfileVersion: normalized.candidateProfile.version,
          isPrimary: activeCount === 0,
        },
        select: this.cvViewSelect,
      });
      this.logger.info('cv_upload_completed', {
        actorId: userId,
        candidateId: candidate.id,
        cvId: created.id,
        fileName: file.originalname,
        parseStatus: this.readParseStatus(created.parsedData),
      });
      return this.toView(created);
    } catch (error) {
      this.logger.error(
        'cv_upload_failed',
        {
          actorId: userId,
          candidateId: candidate.id,
          fileName: file.originalname,
          storedPath,
          errorCode: this.readExceptionCode(error),
        },
        error,
      );

      await this.cvStorageService.remove(storedPath);
      this.logger.info('cv_upload_storage_cleanup_completed', {
        actorId: userId,
        candidateId: candidate.id,
        storedPath,
      });
      throw error;
    }
  }

  private async buildNormalizedCvData(file: Express.Multer.File) {
    try {
      const text = (await this.cvTextExtractorService.extract(file)).slice(
        0,
        CV_MAX_TEXT_CHARS,
      );
      const result = await this.aiNormalizationService.normalizeCv(text);
      return this.toStoredCvData(result);
    } catch (error) {
      if (error instanceof AiNormalizationError) {
        this.logger.warn('cv_normalization_rejected', {
          fileName: file.originalname,
          errorCode: error.code,
          kind: error.kind,
          failureCategory: error.details?.category,
          upstreamStatusCode: error.details?.statusCode ?? undefined,
          upstreamCode: error.details?.providerCode ?? undefined,
          retryable: error.details?.retryable,
          reason: error.details?.reason ?? error.message,
        });
        if (error.kind === 'service_unavailable') {
          throw new ServiceUnavailableException({
            code: error.code,
            message:
              'AI service is unavailable right now. Please try uploading again later.',
            details: { stage: 'normalization' },
          });
        }

        throw new UnprocessableEntityException({
          code: ERROR_CODES.cvParseFailed,
          message:
            'AI parsing failed for this CV. Upload a readable PDF or DOCX and try again.',
          details: { stage: 'normalization', upstreamCode: error.code },
        });
      }

      if (error instanceof HttpException) {
        this.logger.warn('cv_document_processing_failed', {
          fileName: file.originalname,
          errorCode: this.readExceptionCode(error),
        });
      }

      this.logger.warn('cv_parse_failed', {
        fileName: file.originalname,
        reason: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new UnprocessableEntityException({
        code: ERROR_CODES.cvParseFailed,
        message:
          'AI parsing failed for this CV. Upload a readable PDF or DOCX and try again.',
        details: { stage: 'document_processing' },
      });
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
    const current = await this.ensureCvOwnership(candidate.id, cvId);

    const normalizedSkillsPayload =
      dto.skills !== undefined
        ? this.skillStorageAdapter.toStoredSkills(dto.skills, 'cv_manual')
        : null;
    const currentParsedData = this.asRecord(current.parsedData);
    const incomingParsedData =
      dto.parsedData !== undefined ? this.asRecord(dto.parsedData) : {};
    const mergedParsedData =
      dto.parsedData !== undefined
        ? {
            ...currentParsedData,
            ...incomingParsedData,
          }
        : { ...currentParsedData };
    const effectiveSkills = normalizedSkillsPayload
      ? normalizedSkillsPayload.skills
      : Array.isArray(current.skills)
        ? current.skills.filter(
            (entry): entry is string => typeof entry === 'string',
          )
        : [];

    if (normalizedSkillsPayload) {
      mergedParsedData['skills'] = normalizedSkillsPayload.skills;
      const normalizedProfile = this.asRecord(
        mergedParsedData['normalizedProfile'],
      );
      if (Object.keys(normalizedProfile).length > 0) {
        mergedParsedData['normalizedProfile'] = {
          ...normalizedProfile,
          skills: normalizedSkillsPayload.skills,
        };
      }
    }
    if (typeof mergedParsedData['summary'] === 'string') {
      const normalizedProfile = this.asRecord(
        mergedParsedData['normalizedProfile'],
      );
      if (Object.keys(normalizedProfile).length > 0) {
        mergedParsedData['normalizedProfile'] = {
          ...normalizedProfile,
          summary: mergedParsedData['summary'],
        };
      }
    }

    // Sync languages → normalizedProfile.languages
    if (Array.isArray(mergedParsedData['languages'])) {
      const normalizedProfile = this.asRecord(
        mergedParsedData['normalizedProfile'],
      );
      if (Object.keys(normalizedProfile).length > 0) {
        mergedParsedData['normalizedProfile'] = {
          ...normalizedProfile,
          languages: mergedParsedData['languages'],
        };
      }
    }

    const candidateProfile = this.buildCandidateProfile(
      mergedParsedData,
      effectiveSkills,
    );

    const updated = await this.prisma.cV.update({
      where: { id: cvId },
      data: {
        ...(dto.parsedData !== undefined || normalizedSkillsPayload !== null
          ? { parsedData: mergedParsedData as Prisma.InputJsonValue }
          : {}),
        ...(normalizedSkillsPayload
          ? {
              skills: normalizedSkillsPayload.skills as Prisma.InputJsonValue,
              skillAtoms:
                normalizedSkillsPayload.skillAtoms as unknown as Prisma.InputJsonValue,
            }
          : {}),
        candidateProfile: candidateProfile as unknown as Prisma.InputJsonValue,
        candidateProfileVersion: candidateProfile.version,
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
      throw new NotFoundException(
        buildErrorPayload(ERROR_CODES.notFound, 'Candidate profile not found'),
      );
    }
    return candidate;
  }

  private async ensureCvOwnership(
    candidateId: string,
    cvId: string,
  ): Promise<{
    isPrimary: boolean;
    filePath: string;
    parsedData: Prisma.JsonValue;
    skills: Prisma.JsonValue;
  }> {
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
        parsedData: true,
        skills: true,
      },
    });

    if (!cv) {
      throw new NotFoundException(
        buildErrorPayload(ERROR_CODES.notFound, 'CV not found'),
      );
    }

    return cv;
  }

  private readExceptionCode(error: unknown): string | undefined {
    if (!(error instanceof HttpException)) {
      return undefined;
    }

    const response = error.getResponse();
    if (response && typeof response === 'object') {
      const code = (response as Record<string, unknown>)['code'];
      return typeof code === 'string' ? code : undefined;
    }

    return undefined;
  }

  private readParseStatus(value: Prisma.JsonValue): ParseStatus {
    const record = this.asRecord(value);
    const profile = this.asRecord(record['normalizedProfile']);
    const parseStatus = record['parseStatus'] ?? profile['parseStatus'];
    return parseStatus === 'parsed_ok' ? 'parsed_ok' : 'needs_review';
  }

  private toView(item: {
    id: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    parsedData: Prisma.JsonValue;
    skills: Prisma.JsonValue;
    candidateProfile: Prisma.JsonValue | null;
    candidateProfileVersion: string | null;
    isPrimary: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): CvView {
    const parsedData = this.asRecord(
      item.parsedData,
    ) as unknown as CvView['parsedData'];
    const normalizedProfile = this.asRecord(
      parsedData.normalizedProfile,
    ) as unknown as NormalizedProfile;
    const candidateProfile = this.asRecord(item.candidateProfile);
    const parseTelemetry = this.asRecord(parsedData.parseTelemetry);
    const parseStatus = this.normalizeParseStatus(parsedData.parseStatus);
    const skills = Array.isArray(item.skills) ? (item.skills as string[]) : [];
    const resolvedCandidateProfile =
      Object.keys(candidateProfile).length > 0
        ? candidateProfile
        : this.buildCandidateProfile(
            parsedData as unknown as Record<string, unknown>,
            skills,
          );

    return {
      id: item.id,
      fileName: item.fileName,
      fileSize: item.fileSize,
      mimeType: item.mimeType,
      parsedData,
      skills,
      parseStatus,
      normalizedProfile:
        Object.keys(this.asRecord(normalizedProfile)).length > 0
          ? normalizedProfile
          : null,
      candidateProfile:
        Object.keys(this.asRecord(resolvedCandidateProfile)).length > 0
          ? (resolvedCandidateProfile as CvView['candidateProfile'])
          : null,
      candidateProfileVersion:
        item.candidateProfileVersion ??
        (resolvedCandidateProfile as { version?: string }).version ??
        null,
      parseTelemetry:
        Object.keys(parseTelemetry).length > 0
          ? (parseTelemetry as unknown as CvView['parseTelemetry'])
          : null,
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
      candidateProfile: true,
      candidateProfileVersion: true,
      isPrimary: true,
      createdAt: true,
      updatedAt: true,
      filePath: true,
    } satisfies Prisma.CVSelect;
  }

  private toStoredCvData(result: NormalizationResult): {
    parsedData: Record<string, unknown>;
    skills: string[];
    skillAtoms: unknown[];
    candidateProfile: ReturnType<CandidateProfileService['create']>;
  } {
    const storedSkills = this.skillStorageAdapter.toStoredSkills(
      result.profile.skills,
      'cv_parsed',
    );
    const profile = {
      ...result.profile,
      skills: storedSkills.skills,
    };
    const parsedData = {
      skills: storedSkills.skills,
      summary: profile.summary,
      experience: profile.experience,
      education: profile.education,
      contact: {
        languages: profile.languages,
        location: profile.location,
      },
      schemaVersion: result.schemaVersion,
      parseStatus: result.status,
      parseTelemetry: result.telemetry,
      normalizedProfile: profile,
    };
    return {
      parsedData,
      skills: storedSkills.skills,
      skillAtoms: storedSkills.skillAtoms,
      candidateProfile: this.buildCandidateProfile(parsedData, storedSkills.skills),
    };
  }

  private buildCandidateProfile(
    parsedData: Record<string, unknown>,
    skills: string[],
  ) {
    const normalizedProfile = this.asRecord(parsedData['normalizedProfile']);
    return this.candidateProfileService.create({
      normalizedProfile:
        Object.keys(normalizedProfile).length > 0
          ? (normalizedProfile as unknown as NormalizedProfile)
          : null,
      parsedData,
      skills,
    });
  }

  private asRecord(value: unknown): Record<string, unknown> {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
    return {};
  }

  private normalizeParseStatus(value: unknown): ParseStatus {
    return value === 'parsed_ok' || value === 'needs_review'
      ? value
      : 'needs_review';
  }
}
