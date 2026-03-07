import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { JobStatus, Prisma, UserRole } from '@prisma/client';
import { basename, extname } from 'node:path';
import {
  DOCUMENT_MAX_FILE_SIZE_BYTES,
  DOCUMENT_MAX_TEXT_CHARS,
} from '../documents/document-upload.constants';
import { DocumentStorageService } from '../documents/services/document-storage.service';
import { DocumentTextExtractorService } from '../documents/services/document-text-extractor.service';
import { PrismaService } from '../prisma/prisma.service';
import { AiNormalizationService } from '../normalization/ai-normalization.service';
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
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiNormalizationService: AiNormalizationService,
    private readonly jobSlugService: JobSlugService,
    private readonly documentStorageService: DocumentStorageService,
    private readonly documentTextExtractorService: DocumentTextExtractorService,
  ) {}

  async create(recruiterId: string, dto: CreateJobDto): Promise<JobView> {
    this.validateSalaryRange(dto.salaryMin, dto.salaryMax);
    const slug = await this.jobSlugService.generateUniqueSlug(dto.title);
    const normalizedSkills = this.normalizeSkills(dto.skills);
    const normalization = await this.aiNormalizationService.normalizeJob(
      this.composeJobRawText({
        title: dto.title,
        description: dto.description,
        skills: normalizedSkills,
        employmentType: dto.employmentType,
      }),
    );

    try {
      const created = await this.prisma.job.create({
        data: {
          recruiterId,
          title: dto.title,
          slug,
          description: dto.description,
          skills: normalizedSkills as Prisma.InputJsonValue,
          location: this.withNormalizationMeta(dto.location, normalization, {
            inputMode: 'manual',
          }),
          salaryMin: dto.salaryMin ?? null,
          salaryMax: dto.salaryMax ?? null,
          employmentType: dto.employmentType,
        },
        select: this.jobViewSelect,
      });

      return this.toView(created);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('Job slug already exists');
      }
      throw error;
    }
  }

  async createFromFile(
    recruiterId: string,
    file: Express.Multer.File,
  ): Promise<JobView> {
    if (!file) {
      throw new BadRequestException('JD file is required');
    }
    if (file.size > DOCUMENT_MAX_FILE_SIZE_BYTES) {
      throw new PayloadTooLargeException('JD file is too large');
    }

    this.documentTextExtractorService.assertSupported(file);

    const rawText = (
      await this.documentTextExtractorService.extract(file, 'JD')
    ).slice(0, DOCUMENT_MAX_TEXT_CHARS);
    const normalization =
      await this.aiNormalizationService.normalizeJob(rawText);
    const draft = this.mapUploadToDraft(
      normalization.profile,
      rawText,
      file.originalname,
    );
    const slug = await this.jobSlugService.generateUniqueSlug(draft.title);
    const storedPath = await this.documentStorageService.save(
      'jobs',
      recruiterId,
      file,
    );

    try {
      const created = await this.prisma.job.create({
        data: {
          recruiterId,
          title: draft.title,
          slug,
          description: draft.description,
          skills: draft.skills as Prisma.InputJsonValue,
          location: this.withNormalizationMeta(null, normalization, {
            inputMode: 'file_upload',
            sourceDocument: {
              fileName: file.originalname,
              mimeType: file.mimetype,
              fileSize: file.size,
              storedPath,
            },
          }),
          salaryMin: null,
          salaryMax: null,
          employmentType: draft.employmentType,
          status: JobStatus.DRAFT,
        },
        select: this.jobViewSelect,
      });

      return this.toView(created);
    } catch (error) {
      await this.documentStorageService.remove('jobs', storedPath);
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('Job slug already exists');
      }
      throw error;
    }
  }

  async list(
    viewer: Viewer | null,
    query: QueryJobsDto,
  ): Promise<JobsListResponse> {
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
    const existing = await this.getRecruiterOwnedJobOrThrow(recruiterId, id);
    this.validateSalaryRange(dto.salaryMin, dto.salaryMax);

    const slug =
      dto.title !== undefined
        ? await this.jobSlugService.generateUniqueSlug(dto.title, existing.id)
        : existing.slug;
    const nextSkills =
      dto.skills !== undefined
        ? this.normalizeSkills(dto.skills)
        : this.normalizeSkills(this.readJsonStringArray(existing.skills));
    const nextTitle = dto.title ?? existing.title;
    const nextDescription = dto.description ?? existing.description;
    const nextEmploymentType = dto.employmentType ?? existing.employmentType;
    const normalization = await this.aiNormalizationService.normalizeJob(
      this.composeJobRawText({
        title: nextTitle,
        description: nextDescription,
        skills: nextSkills,
        employmentType: nextEmploymentType,
      }),
    );
    const baseLocation =
      dto.location !== undefined
        ? dto.location
        : this.stripNormalizationMeta(existing.location);
    const existingInputMode = this.readInputMode(existing.location) ?? 'manual';

    try {
      const updated = await this.prisma.job.update({
        where: { id },
        data: {
          ...(dto.title !== undefined ? { title: dto.title, slug } : {}),
          ...(dto.description !== undefined
            ? { description: dto.description }
            : {}),
          ...(dto.skills !== undefined
            ? {
                skills: nextSkills as Prisma.InputJsonValue,
              }
            : {}),
          location: this.withNormalizationMeta(baseLocation, normalization, {
            existingLocation: existing.location,
            inputMode: existingInputMode,
          }),
          ...(dto.salaryMin !== undefined ? { salaryMin: dto.salaryMin } : {}),
          ...(dto.salaryMax !== undefined ? { salaryMax: dto.salaryMax } : {}),
          ...(dto.employmentType !== undefined
            ? { employmentType: dto.employmentType }
            : {}),
        },
        select: this.jobViewSelect,
      });

      return this.toView(updated);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('Job slug already exists');
      }
      throw error;
    }
  }

  async softDelete(
    recruiterId: string,
    id: string,
  ): Promise<{ success: true }> {
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
        location: true,
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

  private toView(item: {
    id: string;
    recruiterId: string;
    title: string;
    slug: string;
    description: string;
    skills: Prisma.JsonValue;
    location: Prisma.JsonValue | null;
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

    return {
      ...item,
      skills: Array.isArray(item.skills) ? (item.skills as string[]) : [],
      inputMode:
        this.normalizeInputMode(normalization['inputMode']) ?? 'manual',
      location: this.stripNormalizationMeta(item.location),
      parseStatus: this.normalizeParseStatus(normalization['parseStatus']),
      normalizedProfile:
        Object.keys(normalizedProfile).length > 0
          ? (normalizedProfile as unknown as NormalizedProfile)
          : null,
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
      location: true,
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

  private asRecord(value: unknown): Record<string, unknown> {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
    return {};
  }

  private normalizeParseStatus(value: unknown): ParseStatus {
    return value === 'parsed_ok' ||
      value === 'fallback' ||
      value === 'needs_review'
      ? value
      : 'needs_review';
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
