import {
  BadRequestException,
  ForbiddenException,
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
import { CreateCvDto } from './dto/create-cv.dto';
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
  NORMALIZED_SCHEMA_VERSION,
  NormalizedProfile,
  ParseStatus,
} from '../normalization/normalization.types';
import { CvStorageService } from './services/cv-storage.service';
import { CvTextExtractorService } from './services/cv-text-extractor.service';
import { VectorSyncService } from '../matching/rag/vector-sync.service';
import { CvAiParserService } from './services/cv-ai-parser.service';

@Injectable()
export class CvsService {
  constructor(
    private readonly logger: AppLogger,
    private readonly prisma: PrismaService,
    private readonly cvStorageService: CvStorageService,
    private readonly cvTextExtractorService: CvTextExtractorService,
    private readonly candidateProfileService: CandidateProfileService,
    private readonly skillStorageAdapter: SkillStorageAdapterService,
    private readonly vectorSync: VectorSyncService,
    private readonly cvAiParser: CvAiParserService,
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
        message:
          'Could not read CV file. Upload a readable PDF or DOCX and try again.',
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
      this.vectorSync
        .syncCv(created.id)
        .catch((err) => this.logger.error('cv_vector_sync_failed', err));
      this.parseCvInBackground(created.id, rawText).catch((err) =>
        this.logger.error(
          'cv_background_parse_unhandled',
          { cvId: created.id },
          err,
        ),
      );
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

  // ─── Builder Methods ───────────────────────────────────────────

  async createFromBuilder(userId: string, dto: CreateCvDto): Promise<CvView> {
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

    const parsedData = this.buildNormalizedParsedData(dto);
    const rawText = this.generateRawText(dto);
    const normalizedSkills = this.skillStorageAdapter.toStoredSkills(
      dto.skills,
      'cv_builder',
    );
    const candidateProfile = this.buildCandidateProfile(
      parsedData,
      normalizedSkills.skills,
    );

    const created = await this.prisma.cV.create({
      data: {
        candidateId: candidate.id,
        source: 'builder',
        templateId: dto.templateId ?? 'simple',
        fileName: `${dto.profile.name} - CV.pdf`,
        filePath: '',
        fileSize: 0,
        mimeType: 'application/json',
        parsedData: parsedData as unknown as Prisma.InputJsonValue,
        skills: normalizedSkills.skills as Prisma.InputJsonValue,
        skillAtoms:
          normalizedSkills.skillAtoms as unknown as Prisma.InputJsonValue,
        rawText,
        candidateProfile: candidateProfile as unknown as Prisma.InputJsonValue,
        candidateProfileVersion:
          candidateProfile &&
          typeof candidateProfile === 'object' &&
          'version' in candidateProfile
            ? (candidateProfile as { version: string }).version
            : null,
        isPrimary: activeCount === 0,
      },
      select: this.cvViewSelect,
    });

    this.logger.info('cv_builder_created', {
      actorId: userId,
      candidateId: candidate.id,
      cvId: created.id,
      templateId: dto.templateId ?? 'simple',
    });

    this.vectorSync
      .syncCv(created.id)
      .catch((err) => this.logger.error('cv_vector_sync_failed', err));
    return this.toView(created);
  }

  async updateBuilderCv(
    userId: string,
    cvId: string,
    dto: CreateCvDto,
  ): Promise<CvView> {
    const candidate = await this.getCandidateOrThrow(userId);
    const current = await this.ensureCvOwnership(candidate.id, cvId);

    // Allow CVs to be updated (including uploaded CVs being converted to builder CVs)
    const parsedData = this.buildNormalizedParsedData(dto);
    const rawText = this.generateRawText(dto);
    const normalizedSkills = this.skillStorageAdapter.toStoredSkills(
      dto.skills,
      'cv_builder',
    );
    const candidateProfile = this.buildCandidateProfile(
      parsedData,
      normalizedSkills.skills,
    );

    const updated = await this.prisma.cV.update({
      where: { id: cvId },
      data: {
        templateId: dto.templateId ?? 'simple',
        parsedData: parsedData as unknown as Prisma.InputJsonValue,
        skills: normalizedSkills.skills as Prisma.InputJsonValue,
        skillAtoms:
          normalizedSkills.skillAtoms as unknown as Prisma.InputJsonValue,
        rawText,
        candidateProfile: candidateProfile as unknown as Prisma.InputJsonValue,
        candidateProfileVersion:
          candidateProfile &&
          typeof candidateProfile === 'object' &&
          'version' in candidateProfile
            ? (candidateProfile as { version: string }).version
            : null,
      },
      select: this.cvViewSelect,
    });

    this.logger.info('cv_builder_updated', {
      actorId: userId,
      candidateId: candidate.id,
      cvId,
      templateId: dto.templateId ?? 'simple',
    });

    await this.vectorSync
      .syncCv(updated.id)
      .catch((err) => this.logger.error('cv_vector_sync_failed', err));
    return this.toView(updated);
  }

  private generateRawText(dto: CreateCvDto): string {
    const lines: string[] = [];
    lines.push(dto.profile.name);
    if (dto.profile.summary) lines.push(dto.profile.summary);

    for (const exp of dto.experience) {
      lines.push(`${exp.role} at ${exp.company}`);
      lines.push(`${exp.startDate} - ${exp.endDate ?? 'Present'}`);
      if (exp.description) lines.push(exp.description);
      if (exp.tech?.length) lines.push(`Technologies: ${exp.tech.join(', ')}`);
    }

    for (const edu of dto.education) {
      lines.push(`${edu.degree} ${edu.field ?? ''} - ${edu.school}`.trim());
      if (edu.gpa) lines.push(`GPA: ${edu.gpa}`);
    }

    if (dto.skills.length) lines.push(`Skills: ${dto.skills.join(', ')}`);

    for (const p of dto.projects ?? []) {
      lines.push(`Project: ${p.name}`);
      if (p.description) lines.push(p.description);
      if (p.tech?.length) lines.push(`Tech: ${p.tech.join(', ')}`);
    }

    if (dto.certifications?.length)
      lines.push(`Certifications: ${dto.certifications.join(', ')}`);
    if (dto.languages?.length)
      lines.push(`Languages: ${dto.languages.join(', ')}`);

    return lines.join('\n');
  }

  private buildNormalizedParsedData(dto: CreateCvDto): Record<string, unknown> {
    const title =
      dto.experience.length > 0
        ? dto.experience[0].role
        : (dto.profile.summary?.slice(0, 100) ?? '');

    const normalizedProfile: NormalizedProfile = {
      schemaVersion: NORMALIZED_SCHEMA_VERSION,
      language: 'vi',
      candidateName: dto.profile.name,
      title,
      summary: dto.profile.summary ?? '',
      skills: dto.skills,
      experience: dto.experience.map((exp) => ({
        role: exp.role,
        company: exp.company,
        startDate: exp.startDate,
        endDate: exp.endDate ?? null,
        description: exp.description,
        tech: exp.tech ?? [],
      })),
      education: dto.education.map((edu) => ({
        school: edu.school,
        degree: edu.degree,
        field: edu.field ?? '',
        startDate: edu.startDate ?? null,
        endDate: edu.endDate ?? null,
        gpa: edu.gpa ?? null,
      })),
      certifications: dto.certifications ?? [],
      projects: (dto.projects ?? []).map((p) => ({
        name: p.name,
        description: p.description ?? '',
        tech: p.tech ?? [],
      })),
      languages: dto.languages ?? [],
      location: {
        city: dto.profile.location?.city ?? '',
        country: dto.profile.location?.country ?? '',
      },
      rawQuality: {
        score: 100,
        needsManualReview: false,
        reason: 'builder_generated',
      },
    };

    return {
      parseStatus: 'parsed_ok',
      source: 'builder',
      normalizedProfile,
      builderData: {
        templateId: dto.templateId ?? 'simple',
        // Preserve `undefined` semantics — do not coerce missing tokens to
        // defaults on the server. Frontend applies DEFAULT_DESIGN_TOKENS on read.
        designTokens: dto.designTokens,
        profile: dto.profile,
        experience: dto.experience,
        education: dto.education,
        projects: dto.projects ?? [],
        certifications: dto.certifications ?? [],
        languages: dto.languages ?? [],
      },
    };
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

  async getFileInfo(
    userId: string,
    cvId: string,
  ): Promise<{ absolutePath: string; mimeType: string; fileName: string }> {
    const candidate = await this.getCandidateOrThrow(userId);
    const cv = await this.ensureCvOwnership(candidate.id, cvId);

    if (!cv.filePath) {
      throw new NotFoundException('CV file not found');
    }

    const absolutePath = this.cvStorageService.getAbsolutePath(cv.filePath);
    const mimeType = cv.fileName.toLowerCase().endsWith('.pdf')
      ? 'application/pdf'
      : 'application/octet-stream';

    return {
      absolutePath,
      mimeType,
      fileName: cv.fileName,
    };
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
      Object.keys(this.asRecord(mergedParsedData['normalizedProfile'])).length >
      0;
    const candidateProfile = hasNormalizedProfile
      ? this.buildCandidateProfile(mergedParsedData, effectiveSkills)
      : null;
    const shouldWriteCvDerivedFields =
      dto.parsedData !== undefined ||
      normalizedSkillsPayload !== null ||
      dto.fileName !== undefined;

    const updated = await this.prisma.cV.update({
      where: { id: cvId },
      data: {
        ...(dto.fileName !== undefined ? { fileName: dto.fileName } : {}),
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
              candidateProfile:
                candidateProfile as unknown as Prisma.InputJsonValue,
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

    this.vectorSync
      .syncCv(updated.id)
      .catch((err) => this.logger.error('cv_vector_sync_failed', err));
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

      await transaction.recommendationScan.deleteMany({
        where: { cvId },
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
    source: string;
    fileName: string;
  }> {
    // Look up the CV by id only (without candidate scoping) so we can
    // distinguish between "does not exist" (404) and "exists but not owned
    // by this candidate" (403). Soft-deleted CVs are treated as missing.
    const cv = await this.prisma.cV.findFirst({
      where: {
        id: cvId,
        deletedAt: null,
      },
      select: {
        id: true,
        candidateId: true,
        isPrimary: true,
        filePath: true,
        parsedData: true,
        skills: true,
        source: true,
        fileName: true,
      },
    });

    if (!cv) {
      throw new NotFoundException(
        buildErrorPayload(ERROR_CODES.notFound, 'CV not found'),
      );
    }

    if (cv.candidateId !== candidateId) {
      throw new ForbiddenException(
        buildErrorPayload(
          ERROR_CODES.forbidden,
          'You do not have permission to access this CV',
        ),
      );
    }

    return {
      isPrimary: cv.isPrimary,
      filePath: cv.filePath,
      parsedData: cv.parsedData,
      skills: cv.skills,
      source: cv.source,
      fileName: cv.fileName,
    };
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
    source: string;
    templateId: string;
    isPrimary: boolean;
    createdAt: Date;
    updatedAt: Date;
    candidate?: {
      phone: string | null;
      location: Prisma.JsonValue;
      user: {
        name: string;
        email: string;
        avatar: string | null;
      };
    } | null;
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
    const resolvedCandidateProfile = isPendingApply
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
        ? (resolvedCandidateProfile as { version: string }).version
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
        item.candidateProfileVersion ?? resolvedCandidateProfileVersion ?? null,
      parseTelemetry:
        Object.keys(parseTelemetry).length > 0
          ? (parseTelemetry as unknown as CvView['parseTelemetry'])
          : null,
      candidate: item.candidate
        ? {
            phone: item.candidate.phone,
            location: item.candidate.location,
            user: {
              name: item.candidate.user.name,
              email: item.candidate.user.email,
              avatar: item.candidate.user.avatar,
            },
          }
        : null,
      source: item.source,
      templateId: item.templateId,
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
      source: true,
      templateId: true,
      isPrimary: true,
      createdAt: true,
      updatedAt: true,
      filePath: true,
      candidate: {
        select: {
          phone: true,
          location: true,
          user: {
            select: {
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
      },
      // rawText intentionally excluded — too large for list/detail responses.
      // MatchingService reads rawText via a separate targeted query.
    } satisfies Prisma.CVSelect;
  }
  private async parseCvInBackground(
    cvId: string,
    rawText: string,
  ): Promise<void> {
    try {
      this.logger.info('background_cv_parse_started', { cvId });
      const parsed = (await this.cvAiParser.parse(rawText)) as any;

      const normalizedSkills = this.skillStorageAdapter.toStoredSkills(
        parsed.skills || [],
        'cv_parsed',
      );

      const candidateProfile = this.buildCandidateProfile(
        parsed,
        normalizedSkills.skills,
      );

      await this.prisma.cV.update({
        where: { id: cvId },
        data: {
          parsedData: parsed as Prisma.InputJsonValue,
          skills: normalizedSkills.skills as Prisma.InputJsonValue,
          skillAtoms:
            normalizedSkills.skillAtoms as unknown as Prisma.InputJsonValue,
          candidateProfile:
            candidateProfile as unknown as Prisma.InputJsonValue,
          candidateProfileVersion: candidateProfile?.version ?? null,
        },
      });

      this.logger.info('background_cv_parse_completed', { cvId });
      // We explicitly skip vectorSync here so the user can review and edit their parsed CV first.
    } catch (error) {
      this.logger.error('background_cv_parse_failed', { cvId }, error);
    }
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
