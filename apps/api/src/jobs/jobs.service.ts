import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
  ServiceUnavailableException,
  UnprocessableEntityException,
  UnauthorizedException,
} from '@nestjs/common';
import { JobStatus, Prisma, UserRole } from '@prisma/client';
import { basename, extname } from 'node:path';
import { buildErrorPayload } from '../common/errors/api-error-envelope';
import { ERROR_CODES } from '../common/errors/error-codes';
import { AppLogger } from '../common/logging/app-logger.service';
import {
  DOCUMENT_MAX_FILE_SIZE_BYTES,
  DOCUMENT_MAX_TEXT_CHARS,
} from '../documents/document-upload.constants';
import { DocumentStorageService } from '../documents/services/document-storage.service';
import { DocumentTextExtractorService } from '../documents/services/document-text-extractor.service';
import { JobRequirementsSchemaService } from '../matching/services/job-requirements-schema.service';
import { SkillStorageAdapterService } from '../matching/services/skill-storage-adapter.service';
import { PrismaService } from '../prisma/prisma.service';
import { AiNormalizationService } from '../normalization/ai-normalization.service';
import { AiNormalizationError } from '../normalization/normalization.errors';
import {
  JOB_LOCATION_NORMALIZATION_KEY,
  NormalizationResult,
  NormalizedProfile,
  ParseStatus,
} from '../normalization/normalization.types';
import { CreateJobDto } from './dto/create-job.dto';
import { QueryJobsDto } from './dto/query-jobs.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JobsListResponse, JobView } from './jobs.types';
import { JobSlugService } from './services/job-slug.service';

type Viewer = {
  sub: string;
  role: UserRole;
};

type JobInputMode = 'manual' | 'file_upload';

type SourceDocumentMeta = {
  fileName: string;
  mimeType: string;
  fileSize: number;
  storedPath?: string;
};

@Injectable()
export class JobsService {
  private readonly slugRetryAttempts = 3;

  constructor(
    private readonly logger: AppLogger,
    private readonly prisma: PrismaService,
    private readonly aiNormalizationService: AiNormalizationService,
    private readonly jobSlugService: JobSlugService,
    private readonly documentStorageService: DocumentStorageService,
    private readonly documentTextExtractorService: DocumentTextExtractorService,
    private readonly jobRequirementsSchemaService: JobRequirementsSchemaService,
    private readonly skillStorageAdapter: SkillStorageAdapterService,
  ) {}

  async create(recruiterId: string, dto: CreateJobDto): Promise<JobView> {
    await this.ensureRecruiterUserOrThrow(recruiterId);
    this.validateSalaryRange(dto.salaryMin, dto.salaryMax);
    const storedSkills = this.skillStorageAdapter.toStoredSkills(
      dto.skills,
      'job_manual',
    );
    const normalization = this.syncNormalizationSkills(
      await this.normalizeJobOrThrow(
        this.composeJobRawText({
          title: dto.title,
          description: dto.description,
          skills: storedSkills.skills,
          employmentType: dto.employmentType,
        }),
        'AI parsing failed for this job. Please try again.',
      ),
      storedSkills.skills,
    );
    const location = this.withNormalizationMeta(dto.location, normalization, {
      inputMode: 'manual',
    });
    const requirementsSchema = this.buildRequirementsSchema({
      title: dto.title,
      description: dto.description,
      skills: storedSkills.skills,
      location,
    });

    return this.withUniqueJobSlug(dto.title, async (slug) => {
      const created = await this.prisma.job.create({
        data: {
          recruiterId,
          title: dto.title,
          slug,
          description: dto.description,
          skills: storedSkills.skills as Prisma.InputJsonValue,
          skillAtoms:
            storedSkills.skillAtoms as unknown as Prisma.InputJsonValue,
          location,
          requirementsSchema:
            requirementsSchema as unknown as Prisma.InputJsonValue,
          requirementsSchemaVersion: requirementsSchema.version,
          salaryMin: dto.salaryMin ?? null,
          salaryMax: dto.salaryMax ?? null,
          employmentType: dto.employmentType,
        },
        select: this.jobViewSelect,
      });

      return this.toView(created);
    });
  }

  async createFromFile(
    recruiterId: string,
    file: Express.Multer.File,
  ): Promise<JobView> {
    if (!file) {
      throw new BadRequestException(
        buildErrorPayload(ERROR_CODES.jdFileRequired, 'JD file is required'),
      );
    }
    if (file.size > DOCUMENT_MAX_FILE_SIZE_BYTES) {
      throw new PayloadTooLargeException(
        buildErrorPayload(ERROR_CODES.jdFileTooLarge, 'JD file is too large'),
      );
    }

    await this.ensureRecruiterUserOrThrow(recruiterId);

    this.documentTextExtractorService.assertSupported(file);
    this.logger.info('job_upload_started', {
      actorId: recruiterId,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
    });

    const rawText = await this.extractJobTextOrThrow(file);
    const normalization = await this.normalizeJobOrThrow(
      rawText,
      'AI parsing failed for this JD. Upload a readable PDF or DOCX and try again.',
    );
    const draft = this.mapUploadToDraft(
      normalization.profile,
      rawText,
      file.originalname,
    );
    const storedSkills = this.skillStorageAdapter.toStoredSkills(
      draft.skills,
      'job_parsed',
    );
    const syncedNormalization = this.syncNormalizationSkills(
      normalization,
      storedSkills.skills,
    );
    const location = this.withNormalizationMeta(null, syncedNormalization, {
      inputMode: 'file_upload',
      sourceDocument: {
        fileName: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
      },
    });
    const requirementsSchema = this.buildRequirementsSchema({
      title: draft.title,
      description: draft.description,
      skills: storedSkills.skills,
      location,
    });
    const storedPath = await this.documentStorageService.save(
      'jobs',
      recruiterId,
      file,
    );
    let createdJobId: string | null = null;

    try {
      const created = await this.withUniqueJobSlug(
        draft.title,
        async (slug) => {
          return this.prisma.job.create({
            data: {
              recruiterId,
              title: draft.title,
              slug,
              description: draft.description,
              skills: storedSkills.skills as Prisma.InputJsonValue,
              skillAtoms:
                storedSkills.skillAtoms as unknown as Prisma.InputJsonValue,
              location: this.withStoredDocumentPath(location, storedPath),
              requirementsSchema:
                requirementsSchema as unknown as Prisma.InputJsonValue,
              requirementsSchemaVersion: requirementsSchema.version,
              salaryMin: null,
              salaryMax: null,
              employmentType: draft.employmentType,
              status: JobStatus.DRAFT,
            },
            select: this.jobViewSelect,
          });
        },
      );
      createdJobId = created.id;

      this.logger.info('job_upload_completed', {
        actorId: recruiterId,
        jobId: created.id,
        fileName: file.originalname,
        storedPath,
        parseStatus: this.readParseStatus(created.location),
      });

      return this.toView(created);
    } catch (error) {
      this.logger.error(
        'job_upload_failed',
        {
          actorId: recruiterId,
          fileName: file.originalname,
          storedPath,
          jobId: createdJobId,
          errorCode: this.readExceptionCode(error),
        },
        error,
      );

      let rolledBackJob = !createdJobId;
      if (createdJobId) {
        try {
          await this.prisma.job.delete({ where: { id: createdJobId } });
          rolledBackJob = true;
          this.logger.info('job_upload_rollback_completed', {
            actorId: recruiterId,
            jobId: createdJobId,
          });
        } catch (cleanupError) {
          this.logger.error(
            'job_upload_rollback_failed',
            {
              actorId: recruiterId,
              jobId: createdJobId,
            },
            cleanupError,
          );
        }
      }

      if (rolledBackJob) {
        await this.documentStorageService.remove('jobs', storedPath);
        this.logger.info('job_upload_storage_cleanup_completed', {
          actorId: recruiterId,
          storedPath,
        });
      }
      throw error;
    }
  }

  async list(
    viewer: Viewer | null,
    query: QueryJobsDto,
  ): Promise<JobsListResponse> {
    if (viewer?.role === UserRole.RECRUITER) {
      await this.ensureRecruiterUserOrThrow(viewer.sub);
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where = this.buildListWhere(viewer, query);

    const [items, totalItems] = await Promise.all([
      this.prisma.job.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: this.jobViewSelect,
      }),
      this.prisma.job.count({ where }),
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

  async getByIdOrSlug(
    viewer: Viewer | null,
    idOrSlug: string,
  ): Promise<JobView> {
    if (viewer?.role === UserRole.RECRUITER) {
      await this.ensureRecruiterUserOrThrow(viewer.sub);
    }

    const job = await this.prisma.job.findFirst({
      where: {
        deletedAt: null,
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      select: this.jobViewSelect,
    });
    if (!job) {
      throw new NotFoundException('Job not found');
    }

    const canViewPrivate =
      viewer?.role === UserRole.RECRUITER && viewer.sub === job.recruiterId;
    if (job.status !== JobStatus.PUBLISHED && !canViewPrivate) {
      throw new NotFoundException('Job not found');
    }

    return this.toView(job);
  }

  async update(
    recruiterId: string,
    id: string,
    dto: UpdateJobDto,
  ): Promise<JobView> {
    await this.ensureRecruiterUserOrThrow(recruiterId);
    const existing = await this.getRecruiterOwnedJobOrThrow(recruiterId, id);
    this.validateSalaryRange(dto.salaryMin, dto.salaryMax);
    const existingInputMode = this.readInputMode(existing.location) ?? 'manual';
    const shouldRenormalize =
      dto.title !== undefined ||
      dto.description !== undefined ||
      dto.skills !== undefined ||
      dto.employmentType !== undefined;
    const shouldRefreshRequirementsSchema =
      shouldRenormalize || dto.location !== undefined;

    const nextSkills =
      dto.skills !== undefined
        ? dto.skills
        : this.readPersistedOrNormalizedSkills(
            existing.skills,
            existing.location,
          );
    const nextSkillPayload = this.skillStorageAdapter.toStoredSkills(
      nextSkills,
      dto.skills !== undefined
        ? 'job_manual'
        : existingInputMode === 'file_upload'
          ? 'job_parsed'
          : 'job_manual',
    );
    const nextTitle = dto.title ?? existing.title;
    const nextDescription = dto.description ?? existing.description;
    const nextEmploymentType = dto.employmentType ?? existing.employmentType;
    const baseLocation =
      dto.location !== undefined
        ? dto.location
        : this.stripNormalizationMeta(existing.location);
    const nextLocation = shouldRenormalize
      ? this.withNormalizationMeta(
          baseLocation,
          this.syncNormalizationSkills(
            await this.normalizeJobOrThrow(
              this.composeJobRawText({
                title: nextTitle,
                description: nextDescription,
                skills: nextSkillPayload.skills,
                employmentType: nextEmploymentType,
              }),
              'AI parsing failed for this job. Please try again.',
            ),
            nextSkillPayload.skills,
          ),
          {
            existingLocation: existing.location,
            inputMode: existingInputMode,
          },
        )
      : dto.location !== undefined
        ? this.preserveNormalizationMeta(baseLocation, existing.location)
        : undefined;
    const requirementsSchema = shouldRefreshRequirementsSchema
      ? this.buildRequirementsSchema({
          title: nextTitle,
          description: nextDescription,
          skills: nextSkillPayload.skills,
          location: nextLocation ?? existing.location,
        })
      : null;

    if (dto.title === undefined) {
      const updated = await this.prisma.job.update({
        where: { id },
        data: {
          ...(dto.description !== undefined
            ? { description: dto.description }
            : {}),
          ...(shouldRenormalize
            ? {
                skills: nextSkillPayload.skills as Prisma.InputJsonValue,
                skillAtoms:
                  nextSkillPayload.skillAtoms as unknown as Prisma.InputJsonValue,
              }
            : {}),
          ...(nextLocation !== undefined ? { location: nextLocation } : {}),
          ...(requirementsSchema
            ? {
                requirementsSchema:
                  requirementsSchema as unknown as Prisma.InputJsonValue,
                requirementsSchemaVersion: requirementsSchema.version,
              }
            : {}),
          ...(dto.salaryMin !== undefined ? { salaryMin: dto.salaryMin } : {}),
          ...(dto.salaryMax !== undefined ? { salaryMax: dto.salaryMax } : {}),
          ...(dto.employmentType !== undefined
            ? { employmentType: dto.employmentType }
            : {}),
        },
        select: this.jobViewSelect,
      });

      return this.toView(updated);
    }

    const updated = await this.withUniqueJobSlug(
      dto.title,
      async (slug) => {
        return this.prisma.job.update({
          where: { id },
          data: {
            title: dto.title,
            slug,
            ...(dto.description !== undefined
              ? { description: dto.description }
              : {}),
            ...(shouldRenormalize
              ? {
                  skills: nextSkillPayload.skills as Prisma.InputJsonValue,
                  skillAtoms:
                    nextSkillPayload.skillAtoms as unknown as Prisma.InputJsonValue,
                }
              : {}),
            ...(nextLocation !== undefined ? { location: nextLocation } : {}),
            ...(requirementsSchema
              ? {
                  requirementsSchema:
                    requirementsSchema as unknown as Prisma.InputJsonValue,
                  requirementsSchemaVersion: requirementsSchema.version,
                }
              : {}),
            ...(dto.salaryMin !== undefined
              ? { salaryMin: dto.salaryMin }
              : {}),
            ...(dto.salaryMax !== undefined
              ? { salaryMax: dto.salaryMax }
              : {}),
            ...(dto.employmentType !== undefined
              ? { employmentType: dto.employmentType }
              : {}),
          },
          select: this.jobViewSelect,
        });
      },
      existing.id,
    );

    return this.toView(updated);
  }

  async softDelete(
    recruiterId: string,
    id: string,
  ): Promise<{ success: true }> {
    await this.ensureRecruiterUserOrThrow(recruiterId);
    const job = await this.getRecruiterOwnedJobOrThrow(recruiterId, id);
    await this.prisma.job.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    const storedPath = this.readStoredDocumentPath(job.location);
    if (storedPath) {
      await this.documentStorageService.remove('jobs', storedPath);
    }

    return { success: true };
  }

  async publish(recruiterId: string, id: string): Promise<JobView> {
    await this.ensureRecruiterUserOrThrow(recruiterId);
    const job = await this.getRecruiterOwnedJobOrThrow(recruiterId, id);
    if (job.status !== JobStatus.DRAFT) {
      throw new BadRequestException('Only draft jobs can be published');
    }

    const updated = await this.prisma.job.update({
      where: { id },
      data: {
        status: JobStatus.PUBLISHED,
        publishedAt: new Date(),
        closedAt: null,
      },
      select: this.jobViewSelect,
    });

    return this.toView(updated);
  }

  async close(recruiterId: string, id: string): Promise<JobView> {
    await this.ensureRecruiterUserOrThrow(recruiterId);
    const job = await this.getRecruiterOwnedJobOrThrow(recruiterId, id);
    if (job.status !== JobStatus.PUBLISHED) {
      throw new BadRequestException('Only published jobs can be closed');
    }

    const updated = await this.prisma.job.update({
      where: { id },
      data: {
        status: JobStatus.CLOSED,
        closedAt: new Date(),
      },
      select: this.jobViewSelect,
    });

    return this.toView(updated);
  }

  private async getRecruiterOwnedJobOrThrow(recruiterId: string, id: string) {
    const job = await this.prisma.job.findFirst({
      where: {
        id,
        recruiterId,
        deletedAt: null,
      },
      select: {
        id: true,
        recruiterId: true,
        slug: true,
        title: true,
        description: true,
        skills: true,
        skillAtoms: true,
        location: true,
        requirementsSchema: true,
        requirementsSchemaVersion: true,
        employmentType: true,
        status: true,
      },
    });

    if (!job) {
      throw new ForbiddenException('You cannot access this job');
    }

    return job;
  }

  private buildListWhere(
    viewer: Viewer | null,
    query: QueryJobsDto,
  ): Prisma.JobWhereInput {
    const searchFilter = query.search
      ? {
          OR: [
            {
              title: {
                contains: query.search,
                mode: Prisma.QueryMode.insensitive,
              },
            },
            {
              description: {
                contains: query.search,
                mode: Prisma.QueryMode.insensitive,
              },
            },
          ],
        }
      : {};

    if (viewer?.role === UserRole.RECRUITER) {
      return {
        recruiterId: viewer.sub,
        deletedAt: null,
        ...(query.status ? { status: query.status } : {}),
        ...searchFilter,
      };
    }

    return {
      status: JobStatus.PUBLISHED,
      deletedAt: null,
      ...searchFilter,
    };
  }

  private normalizeSkills(skills: string[]): string[] {
    const unique = new Set<string>();
    for (const skill of skills) {
      const value = skill.trim();
      if (value) {
        unique.add(value);
      }
    }
    return Array.from(unique).slice(0, 100);
  }

  private async ensureRecruiterUserOrThrow(recruiterId: string): Promise<void> {
    const recruiter = await this.prisma.user.findFirst({
      where: {
        id: recruiterId,
        role: UserRole.RECRUITER,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!recruiter) {
      throw new UnauthorizedException('Recruiter account not found');
    }
  }

  private validateSalaryRange(min?: number, max?: number) {
    if (min !== undefined && max !== undefined && min > max) {
      throw new BadRequestException(
        'salaryMin must be less than or equal to salaryMax',
      );
    }
  }

  private isUniqueViolation(error: unknown): boolean {
    const maybeError = error as { code?: string };
    return maybeError?.code === 'P2002';
  }

  private async withUniqueJobSlug<T>(
    title: string,
    operation: (slug: string) => Promise<T>,
    excludeJobId?: string,
  ): Promise<T> {
    let lastError: unknown;

    for (let attempt = 0; attempt < this.slugRetryAttempts; attempt++) {
      const slug = await this.jobSlugService.generateUniqueSlug(
        title,
        excludeJobId,
      );

      try {
        return await operation(slug);
      } catch (error) {
        if (!this.isUniqueViolation(error)) {
          throw error;
        }

        lastError = error;
      }
    }

    if (this.isUniqueViolation(lastError)) {
      throw new ConflictException('Job slug already exists');
    }

    throw lastError;
  }

  private toView(item: {
    id: string;
    recruiterId: string;
    title: string;
    slug: string;
    description: string;
    skills: Prisma.JsonValue;
    location: Prisma.JsonValue | null;
    requirementsSchema: Prisma.JsonValue | null;
    requirementsSchemaVersion: string | null;
    salaryMin: number | null;
    salaryMax: number | null;
    employmentType: string;
    status: JobStatus;
    publishedAt: Date | null;
    closedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): JobView {
    const location =
      item.location &&
      typeof item.location === 'object' &&
      !Array.isArray(item.location)
        ? (item.location as Record<string, unknown>)
        : {};
    const normalization = this.asRecord(
      location[JOB_LOCATION_NORMALIZATION_KEY],
    );
    const parseTelemetry = this.asRecord(normalization['parseTelemetry']);
    const normalizedProfile = this.asRecord(normalization['normalizedProfile']);
    const requirementsSchema = this.asRecord(item.requirementsSchema);
    const resolvedRequirementsSchema =
      Object.keys(requirementsSchema).length > 0
        ? requirementsSchema
        : this.buildRequirementsSchema({
            title: item.title,
            description: item.description,
            skills: this.readPersistedOrNormalizedSkills(item.skills, item.location),
            location: item.location,
          });

    return {
      ...item,
      skills: this.readPersistedOrNormalizedSkills(item.skills, item.location),
      inputMode:
        this.normalizeInputMode(normalization['inputMode']) ?? 'manual',
      location: this.stripNormalizationMeta(item.location),
      parseStatus: this.normalizeParseStatus(normalization['parseStatus']),
      normalizedProfile:
        Object.keys(normalizedProfile).length > 0
          ? (normalizedProfile as unknown as NormalizedProfile)
          : null,
      requirementsSchema:
        Object.keys(this.asRecord(resolvedRequirementsSchema)).length > 0
          ? (resolvedRequirementsSchema as JobView['requirementsSchema'])
          : null,
      requirementsSchemaVersion:
        item.requirementsSchemaVersion ??
        (resolvedRequirementsSchema as { version?: string }).version ??
        null,
      parseTelemetry:
        Object.keys(parseTelemetry).length > 0
          ? (parseTelemetry as unknown as JobView['parseTelemetry'])
          : null,
    };
  }

  private get jobViewSelect() {
    return {
      id: true,
      recruiterId: true,
      title: true,
      slug: true,
      description: true,
      skills: true,
      skillAtoms: true,
      location: true,
      requirementsSchema: true,
      requirementsSchemaVersion: true,
      salaryMin: true,
      salaryMax: true,
      employmentType: true,
      status: true,
      publishedAt: true,
      closedAt: true,
      createdAt: true,
      updatedAt: true,
    } satisfies Prisma.JobSelect;
  }

  private composeJobRawText(input: {
    title: string;
    description: string;
    skills: string[];
    employmentType: string;
  }): string {
    return [
      `Title: ${input.title}`,
      `Description: ${input.description}`,
      `Skills: ${input.skills.join(', ')}`,
      `Employment type: ${input.employmentType}`,
    ].join('\n');
  }

  private syncNormalizationSkills(
    normalization: NormalizationResult,
    skills: string[],
  ): NormalizationResult {
    return {
      ...normalization,
      profile: {
        ...normalization.profile,
        skills,
      },
    };
  }

  private buildRequirementsSchema(input: {
    title: string;
    description: string;
    skills: string[];
    location: unknown;
  }) {
    const locationValue = input.location as
      | Prisma.JsonValue
      | Record<string, unknown>
      | null
      | undefined;
    const normalization = this.readNormalizationMeta(locationValue);
    const normalizedProfile = this.asRecord(
      normalization['normalizedProfile'],
    );
    return this.jobRequirementsSchemaService.create({
      title: input.title,
      summary:
        typeof normalizedProfile['summary'] === 'string'
          ? normalizedProfile['summary']
          : '',
      skills: input.skills,
      description: input.description,
      normalizedProfile:
        Object.keys(normalizedProfile).length > 0
          ? (normalizedProfile as unknown as NormalizedProfile)
          : null,
      location: this.stripNormalizationMeta(locationValue),
    });
  }

  private withNormalizationMeta(
    location: Record<string, unknown> | null | undefined,
    normalization: NormalizationResult,
    options?: {
      existingLocation?: Prisma.JsonValue | Record<string, unknown> | null;
      inputMode?: JobInputMode;
      sourceDocument?: SourceDocumentMeta;
    },
  ): Prisma.InputJsonValue {
    const base = {
      ...(location ?? {}),
    };
    const existingNormalization = this.readNormalizationMeta(
      options?.existingLocation,
    );
    const nextInputMode =
      options?.inputMode ??
      this.normalizeInputMode(existingNormalization['inputMode']);
    const existingSourceDocument = this.asRecord(
      existingNormalization['sourceDocument'],
    );
    const nextSourceDocument =
      options?.sourceDocument ??
      (Object.keys(existingSourceDocument).length > 0
        ? this.toSourceDocumentMeta(existingSourceDocument)
        : null);
    const nextNormalization: Record<string, unknown> = {
      ...existingNormalization,
      schemaVersion: normalization.schemaVersion,
      parseStatus: normalization.status,
      parseTelemetry: normalization.telemetry,
      normalizedProfile: normalization.profile,
    };

    if (nextInputMode) {
      nextNormalization['inputMode'] = nextInputMode;
    }
    if (nextSourceDocument) {
      nextNormalization['sourceDocument'] = nextSourceDocument;
    }

    return {
      ...base,
      [JOB_LOCATION_NORMALIZATION_KEY]: nextNormalization,
    } as unknown as Prisma.InputJsonValue;
  }

  private preserveNormalizationMeta(
    location: Record<string, unknown> | null,
    existingLocation: Prisma.JsonValue | Record<string, unknown> | null,
  ): Prisma.InputJsonValue {
    const base = {
      ...(location ?? {}),
    };
    const existingNormalization = this.readNormalizationMeta(existingLocation);
    return Object.keys(existingNormalization).length > 0
      ? ({
          ...base,
          [JOB_LOCATION_NORMALIZATION_KEY]: existingNormalization,
        } as unknown as Prisma.InputJsonValue)
      : (base as unknown as Prisma.InputJsonValue);
  }

  private withStoredDocumentPath(
    value: Prisma.InputJsonValue,
    storedPath: string,
  ): Prisma.InputJsonValue {
    const root = this.asRecord(value);
    const normalization = this.asRecord(root[JOB_LOCATION_NORMALIZATION_KEY]);
    const sourceDocument = this.asRecord(normalization['sourceDocument']);
    return {
      ...root,
      [JOB_LOCATION_NORMALIZATION_KEY]: {
        ...normalization,
        sourceDocument: {
          ...sourceDocument,
          storedPath,
        },
      },
    } as unknown as Prisma.InputJsonValue;
  }

  private readNormalizationMeta(
    value: Prisma.JsonValue | Record<string, unknown> | null | undefined,
  ): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return {};
    }
    return this.asRecord(
      (value as Record<string, unknown>)[JOB_LOCATION_NORMALIZATION_KEY],
    );
  }

  private stripNormalizationMeta(
    value: Prisma.JsonValue | Record<string, unknown> | null | undefined,
  ): Record<string, unknown> | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }
    const root = value as Record<string, unknown>;
    const clean = { ...root };
    delete clean[JOB_LOCATION_NORMALIZATION_KEY];
    return Object.keys(clean).length > 0 ? clean : null;
  }

  private readJsonStringArray(value: Prisma.JsonValue): string[] {
    if (!Array.isArray(value)) {
      return [];
    }
    return value
      .filter((entry): entry is string => typeof entry === 'string')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  private readPersistedOrNormalizedSkills(
    skills: Prisma.JsonValue,
    location: Prisma.JsonValue | Record<string, unknown> | null,
  ): string[] {
    const persisted = this.readJsonStringArray(skills);
    if (persisted.length > 0) {
      return persisted;
    }

    const normalized = this.asRecord(
      this.readNormalizationMeta(location)['normalizedProfile'],
    );
    return this.readJsonStringArray(normalized['skills'] as Prisma.JsonValue);
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

  private async extractJobTextOrThrow(
    file: Express.Multer.File,
  ): Promise<string> {
    try {
      return (
        await this.documentTextExtractorService.extract(file, 'JD')
      ).slice(0, DOCUMENT_MAX_TEXT_CHARS);
    } catch (error) {
      const errorCode = this.readExceptionCode(error);
      this.logger.warn('job_document_processing_failed', {
        fileName: file.originalname,
        errorCode,
        reason: error instanceof Error ? error.message : 'Unknown error',
      });

      if (error instanceof HttpException && error.getStatus() === 415) {
        throw error;
      }

      throw new UnprocessableEntityException({
        code: ERROR_CODES.jdParseFailed,
        message:
          'AI parsing failed for this JD. Upload a readable PDF or DOCX and try again.',
        details: {
          stage: 'document_processing',
          ...(errorCode ? { upstreamCode: errorCode } : {}),
        },
      });
    }
  }

  private async normalizeJobOrThrow(
    rawText: string,
    message: string,
  ): Promise<NormalizationResult> {
    try {
      return await this.aiNormalizationService.normalizeJob(rawText);
    } catch (error) {
      if (error instanceof AiNormalizationError) {
        this.logger.warn('job_normalization_rejected', {
          errorCode: error.code,
          kind: error.kind,
          reason: error.message,
        });
        if (error.kind === 'service_unavailable') {
          throw new ServiceUnavailableException({
            code: error.code,
            message:
              'AI service is unavailable right now. Please try again later.',
            details: { stage: 'normalization' },
          });
        }

        throw new UnprocessableEntityException({
          code: ERROR_CODES.jdParseFailed,
          message,
          details: {
            stage: 'normalization',
            upstreamCode: error.code,
          },
        });
      }

      this.logger.warn('job_normalization_failed', {
        reason: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new UnprocessableEntityException({
        code: ERROR_CODES.jdParseFailed,
        message,
        details: { stage: 'normalization' },
      });
    }
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

  private readParseStatus(location: Prisma.JsonValue | null): ParseStatus {
    const meta = this.readNormalizationMeta(location);
    const parseStatus = meta['parseStatus'];
    return parseStatus === 'parsed_ok' ? 'parsed_ok' : 'needs_review';
  }

  private mapUploadToDraft(
    profile: NormalizedProfile,
    rawText: string,
    originalName: string,
  ): {
    title: string;
    description: string;
    skills: string[];
    employmentType: string;
  } {
    const fallbackTitle = this.buildFallbackTitle(originalName);
    const title =
      this.clampString(profile.title, 160) ||
      this.clampString(fallbackTitle, 160) ||
      'Imported job draft';
    const description = this.buildDraftDescription(profile, rawText, title);

    return {
      title,
      description,
      skills: this.normalizeSkills(profile.skills),
      employmentType:
        this.clampString(profile.jobMeta?.employmentType, 50) || 'FULL_TIME',
    };
  }

  private buildDraftDescription(
    profile: NormalizedProfile,
    rawText: string,
    title: string,
  ): string {
    const sections = [this.clampString(profile.summary, 4000)];
    const requirements = this.normalizeSkills(
      profile.jobMeta?.requirements ?? [],
    ).slice(0, 20);
    const benefits = this.normalizeSkills(
      profile.jobMeta?.benefits ?? [],
    ).slice(0, 20);

    if (requirements.length > 0) {
      sections.push(`Requirements:\n- ${requirements.join('\n- ')}`);
    }
    if (benefits.length > 0) {
      sections.push(`Benefits:\n- ${benefits.join('\n- ')}`);
    }

    const composed = sections.filter(Boolean).join('\n\n').trim();
    if (composed.length >= 10) {
      return composed.slice(0, 20000);
    }

    const fallback = rawText.trim().slice(0, 20000);
    if (fallback.length >= 10) {
      return fallback;
    }

    return `Imported draft for ${title}`.slice(0, 20000);
  }

  private buildFallbackTitle(originalName: string): string {
    const base = basename(originalName, extname(originalName))
      .replace(/[-_]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return base || 'Imported job draft';
  }

  private clampString(value: unknown, maxLength: number): string {
    return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
  }

  private readInputMode(
    value: Prisma.JsonValue | Record<string, unknown> | null | undefined,
  ): JobInputMode | null {
    const normalization = this.readNormalizationMeta(value);
    return this.normalizeInputMode(normalization['inputMode']);
  }

  private normalizeInputMode(value: unknown): JobInputMode | null {
    return value === 'manual' || value === 'file_upload' ? value : null;
  }

  private toSourceDocumentMeta(
    value: Record<string, unknown>,
  ): SourceDocumentMeta | null {
    const fileName = this.clampString(value['fileName'], 255);
    const mimeType = this.clampString(value['mimeType'], 255);
    const fileSize =
      typeof value['fileSize'] === 'number' &&
      Number.isFinite(value['fileSize'])
        ? value['fileSize']
        : null;
    const storedPath = this.clampString(value['storedPath'], 500);

    if (!fileName || !mimeType || fileSize === null) {
      return null;
    }

    return {
      fileName,
      mimeType,
      fileSize,
      ...(storedPath ? { storedPath } : {}),
    };
  }

  private readStoredDocumentPath(
    value: Prisma.JsonValue | Record<string, unknown> | null | undefined,
  ): string | null {
    if (this.readInputMode(value) !== 'file_upload') {
      return null;
    }

    const sourceDocument = this.asRecord(
      this.readNormalizationMeta(value)['sourceDocument'],
    );
    const storedPath = this.clampString(sourceDocument['storedPath'], 500);
    return storedPath || null;
  }
}
