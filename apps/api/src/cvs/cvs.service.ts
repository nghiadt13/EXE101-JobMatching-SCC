import {
  BadRequestException,
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
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
import { buildErrorPayload } from '../common/errors/api-error-envelope';
import { ERROR_CODES } from '../common/errors/error-codes';
import { AppLogger } from '../common/logging/app-logger.service';
import {
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

    // Extract raw text (cheap, CPU-only — no LLM call at upload time)
    let rawText: string;
    try {
      rawText = (await this.cvTextExtractorService.extract(file)).slice(
        0,
        CV_MAX_TEXT_CHARS,
      );
    } catch {
      throw new UnprocessableEntityException({
        code: ERROR_CODES.cvParseFailed,
        message: 'Could not read CV file. Upload a readable PDF or DOCX and try again.',
        details: { stage: 'text_extraction' },
      });
    }

    const storedPath = await this.cvStorageService.save(candidate.id, file);
    try {
      const stubParsedData: Record<string, unknown> = {
        parseStatus: 'pending_apply',
        rawTextLength: rawText.length,
      };
      const created = await this.prisma.cV.create({
        data: {
          candidateId: candidate.id,
          fileName: file.originalname,
          filePath: storedPath,
          fileSize: file.size,
          mimeType: file.mimetype,
          parsedData: stubParsedData as Prisma.InputJsonValue,
          skills: [] as Prisma.InputJsonValue,
          skillAtoms: [] as Prisma.InputJsonValue,
          rawText,
          candidateProfile: Prisma.JsonNull,
          candidateProfileVersion: null,
          isPrimary: activeCount === 0,
        },
        select: this.cvViewSelect,
      });
      this.logger.info('cv_upload_completed', {
        actorId: userId,
        candidateId: candidate.id,
        cvId: created.id,
        fileName: file.originalname,
        rawTextLength: rawText.length,
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
        },
        error,
      );
      await this.cvStorageService.remove(storedPath);
      throw error;
    }
  }

  // buildNormalizedCvData is kept for reference but no longer called during upload.
  // @deprecated — LLM normalization now happens at apply-time via JdDrivenEvaluationService


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

    // Only rebuild candidateProfile if there is existing normalized data.
    // New CVs (pending_apply) have no normalizedProfile — skip candidateProfile build.
    const hasNormalizedProfile =
      Object.keys(this.asRecord(mergedParsedData['normalizedProfile'])).length > 0;
    const candidateProfile = hasNormalizedProfile
      ? this.buildCandidateProfile(mergedParsedData, effectiveSkills)
      : null;
    const shouldWriteCvDerivedFields =
      dto.parsedData !== undefined || normalizedSkillsPayload !== null;

    const updated = await this.prisma.cV.update({
      where: { id: cvId },
      data: {
        ...(shouldWriteCvDerivedFields
          ? { parsedData: mergedParsedData as Prisma.InputJsonValue }
          : {}),
        ...(normalizedSkillsPayload
          ? {
              skills: normalizedSkillsPayload.skills as Prisma.InputJsonValue,
              skillAtoms:
                normalizedSkillsPayload.skillAtoms as unknown as Prisma.InputJsonValue,
            }
          : {}),
        ...(candidateProfile !== null
          ? {
              candidateProfile: candidateProfile as unknown as Prisma.InputJsonValue,
              candidateProfileVersion: candidateProfile.version,
            }
          : shouldWriteCvDerivedFields
            ? {
                candidateProfile: Prisma.JsonNull,
                candidateProfileVersion: null,
              }
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



  private readParseStatus(value: Prisma.JsonValue): ParseStatus {
    const record = this.asRecord(value);
    const parseStatus = record['parseStatus'];
    if (
      parseStatus === 'parsed_ok' ||
      parseStatus === 'needs_review' ||
      parseStatus === 'pending_apply'
    ) {
      return parseStatus;
    }
    // Legacy: check nested normalizedProfile.parseStatus
    const profile = this.asRecord(record['normalizedProfile']);
    const nested = profile['parseStatus'];
    return nested === 'parsed_ok' ? 'parsed_ok' : 'needs_review';
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
    const isPendingApply = parseStatus === 'pending_apply';
    const resolvedCandidateProfile =
      isPendingApply
        ? null
        : Object.keys(candidateProfile).length > 0
        ? candidateProfile
        : this.buildCandidateProfile(
            parsedData as unknown as Record<string, unknown>,
            skills,
          );
    const resolvedCandidateProfileVersion =
      resolvedCandidateProfile &&
      typeof resolvedCandidateProfile === 'object' &&
      'version' in resolvedCandidateProfile &&
      typeof (resolvedCandidateProfile as { version?: unknown }).version ===
        'string'
        ? ((resolvedCandidateProfile as { version: string }).version as string)
        : null;

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
        resolvedCandidateProfileVersion ??
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
      // rawText intentionally excluded — too large for list/detail responses.
      // MatchingService reads rawText via a separate targeted query.
    } satisfies Prisma.CVSelect;
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
    return value === 'parsed_ok' ||
      value === 'needs_review' ||
      value === 'pending_apply'
      ? value
      : 'needs_review';
  }
}
