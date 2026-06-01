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
import { VectorSyncService } from '../matching/rag/vector-sync.service';
import {
  DOCUMENT_MAX_FILE_SIZE_BYTES,
  DOCUMENT_MAX_TEXT_CHARS,
} from '../documents/document-upload.constants';
import { DocumentStorageService } from '../documents/services/document-storage.service';
import { DocumentTextExtractorService } from '../documents/services/document-text-extractor.service';
import { HomepageCacheService } from '../homepage/homepage-cache.service';
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
import {
  JOB_POSTED_WITHIN_DAYS_VALUES,
  JOB_SORT_VALUES,
  QueryJobsDto,
  type JobsPostedWithinDays,
  type JobsRemoteFilter,
  type JobsSort,
} from './dto/query-jobs.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import {
  SALARY_BAND_RANGES,
  WORKING_DAY_STATUS_VALUES,
} from './job-filter.constants';
import { JobsListResponse, JobView, SaveJobResponse } from './jobs.types';
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
    private readonly homepageCache: HomepageCacheService,
    private readonly jobRequirementsSchemaService: JobRequirementsSchemaService,
    private readonly skillStorageAdapter: SkillStorageAdapterService,
    private readonly vectorSync: VectorSyncService,
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

    const result = await this.withUniqueJobSlug(dto.title, async (slug) => {
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
          workingDayStatus: dto.workingDayStatus ?? null,
          experienceLevel: dto.experienceLevel ?? null,
          minExperienceMonths: dto.minExperienceMonths ?? null,
          companyIndustryKey: dto.companyIndustryKey ?? null,
          jobFieldKey: dto.jobFieldKey ?? null,
          jobLevel: dto.jobLevel ?? null,
          salesModel: dto.salesModel ?? null,
          salaryNegotiable: dto.salaryNegotiable ?? (dto.salaryMin == null && dto.salaryMax == null),
          applicationDeadline: dto.applicationDeadline ? new Date(dto.applicationDeadline) : null,
        },
        select: this.jobViewSelect,
      });

      // Create category join rows
      if (dto.categorySlugs?.length) {
        const categories = await this.prisma.jobCategory.findMany({
          where: { slug: { in: dto.categorySlugs } },
          select: { id: true },
        });
        if (categories.length > 0) {
          await this.prisma.jobCategoryOnJob.createMany({
            data: categories.map(cat => ({ jobId: created.id, categoryId: cat.id })),
            skipDuplicates: true,
          });
        }
      }

      // Create customer type join rows
      if (dto.customerTypes?.length) {
        await this.prisma.jobCustomerTypeOnJob.createMany({
          data: dto.customerTypes.map(type => ({ jobId: created.id, type })),
          skipDuplicates: true,
        });
      }

      return this.toView(created);
    });
    this.homepageCache.clearAll();
    this.vectorSync.syncJob(result.id).catch(err => this.logger.error('job_vector_sync_failed', err));
    return result;
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
              workingDayStatus: 'not_mentioned',
              salaryNegotiable: true,
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

      const response = this.toView(created);
      this.homepageCache.clearAll();
      this.vectorSync.syncJob(created.id).catch(err => this.logger.error('job_vector_sync_failed', err));
      return response;
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
    const limit = query.limit ?? 20;
    const filtersV1Enabled = this.isFeatureEnabled(
      'API_JOBS_FILTERS_V1_ENABLED',
    );
    const facetsV1Enabled = this.isFeatureEnabled('API_JOBS_FACETS_V1_ENABLED');
    const normalizedQuery = this.normalizeListQuery(query);
    const where = filtersV1Enabled
      ? this.buildListWhereV1(viewer, normalizedQuery)
      : this.buildListWhereLegacy(
          viewer,
          normalizedQuery.q,
          normalizedQuery.status,
        );
    const orderBy = filtersV1Enabled
      ? this.buildOrderBy(normalizedQuery.sort)
      : { createdAt: 'desc' as const };

    const [items, totalItems] = await Promise.all([
      this.prisma.job.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
        select: this.jobViewSelect,
      }),
      this.prisma.job.count({ where }),
    ]);
    const response: JobsListResponse = {
      items: items.map((item) => this.toView(item)),
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / limit)),
      },
    };

    if (filtersV1Enabled) {
      response.meta = {
        sort: normalizedQuery.sort,
        appliedFilters: {
          ...(normalizedQuery.q ? { q: normalizedQuery.q } : {}),
          ...(normalizedQuery.employmentTypes?.length
            ? { employmentTypes: normalizedQuery.employmentTypes }
            : {}),
          ...(normalizedQuery.remote ? { remote: normalizedQuery.remote } : {}),
          ...(normalizedQuery.salaryMinGte !== undefined
            ? { salaryMinGte: normalizedQuery.salaryMinGte }
            : {}),
          ...(normalizedQuery.salaryMaxLte !== undefined
            ? { salaryMaxLte: normalizedQuery.salaryMaxLte }
            : {}),
          ...(normalizedQuery.postedWithinDays !== undefined
            ? { postedWithinDays: normalizedQuery.postedWithinDays }
            : {}),
          ...(normalizedQuery.categorySlugs?.length
            ? { categorySlugs: normalizedQuery.categorySlugs }
            : {}),
          ...(normalizedQuery.experienceLevels?.length
            ? { experienceLevels: normalizedQuery.experienceLevels }
            : {}),
          ...(normalizedQuery.companyIndustryKeys?.length
            ? { companyIndustryKeys: normalizedQuery.companyIndustryKeys }
            : {}),
          ...(normalizedQuery.jobFieldKeys?.length
            ? { jobFieldKeys: normalizedQuery.jobFieldKeys }
            : {}),
          ...(normalizedQuery.companyTypes?.length
            ? { companyTypes: normalizedQuery.companyTypes }
            : {}),
          ...(normalizedQuery.salaryBands?.length
            ? { salaryBands: normalizedQuery.salaryBands }
            : {}),
          ...(normalizedQuery.jobLevels?.length
            ? { jobLevels: normalizedQuery.jobLevels }
            : {}),
          ...(normalizedQuery.salesModels?.length
            ? { salesModels: normalizedQuery.salesModels }
            : {}),
          ...(normalizedQuery.customerTypes?.length
            ? { customerTypes: normalizedQuery.customerTypes }
            : {}),
          ...(normalizedQuery.workingDayStatus
            ? { workingDayStatus: normalizedQuery.workingDayStatus }
            : {}),
          ...(normalizedQuery.searchScope
            ? { searchScope: normalizedQuery.searchScope }
            : {}),
          ...(normalizedQuery.location
            ? { location: normalizedQuery.location }
            : {}),
        },
      };
    }

    if (
      filtersV1Enabled &&
      facetsV1Enabled &&
      normalizedQuery.includeFacets === true
    ) {
      response.facets = await this.computeFacets(where);
    }

    return response;
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
          ...(dto.workingDayStatus !== undefined ? { workingDayStatus: dto.workingDayStatus } : {}),
          ...(dto.experienceLevel !== undefined ? { experienceLevel: dto.experienceLevel } : {}),
          ...(dto.minExperienceMonths !== undefined ? { minExperienceMonths: dto.minExperienceMonths } : {}),
          ...(dto.companyIndustryKey !== undefined ? { companyIndustryKey: dto.companyIndustryKey } : {}),
          ...(dto.jobFieldKey !== undefined ? { jobFieldKey: dto.jobFieldKey } : {}),
          ...(dto.jobLevel !== undefined ? { jobLevel: dto.jobLevel } : {}),
          ...(dto.salesModel !== undefined ? { salesModel: dto.salesModel } : {}),
          ...(dto.salaryNegotiable !== undefined ? { salaryNegotiable: dto.salaryNegotiable } : {}),
          ...(dto.applicationDeadline !== undefined
            ? { applicationDeadline: dto.applicationDeadline ? new Date(dto.applicationDeadline) : null }
            : {}),
        },
        select: this.jobViewSelect,
      });

      // Replace category join rows
      if (dto.categorySlugs !== undefined) {
        await this.prisma.jobCategoryOnJob.deleteMany({ where: { jobId: id } });
        if (dto.categorySlugs.length > 0) {
          const categories = await this.prisma.jobCategory.findMany({
            where: { slug: { in: dto.categorySlugs } },
            select: { id: true },
          });
          if (categories.length > 0) {
            await this.prisma.jobCategoryOnJob.createMany({
              data: categories.map(cat => ({ jobId: id, categoryId: cat.id })),
            });
          }
        }
      }

      // Replace customer type join rows
      if (dto.customerTypes !== undefined) {
        await this.prisma.jobCustomerTypeOnJob.deleteMany({ where: { jobId: id } });
        if (dto.customerTypes.length > 0) {
          await this.prisma.jobCustomerTypeOnJob.createMany({
            data: dto.customerTypes.map(type => ({ jobId: id, type })),
          });
        }
      }

      const response = this.toView(updated);
      this.homepageCache.clearAll();
      this.vectorSync.syncJob(updated.id).catch(err => this.logger.error('job_vector_sync_failed', err));
      return response;
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
            ...(dto.workingDayStatus !== undefined ? { workingDayStatus: dto.workingDayStatus } : {}),
            ...(dto.experienceLevel !== undefined ? { experienceLevel: dto.experienceLevel } : {}),
            ...(dto.minExperienceMonths !== undefined ? { minExperienceMonths: dto.minExperienceMonths } : {}),
            ...(dto.companyIndustryKey !== undefined ? { companyIndustryKey: dto.companyIndustryKey } : {}),
            ...(dto.jobFieldKey !== undefined ? { jobFieldKey: dto.jobFieldKey } : {}),
            ...(dto.jobLevel !== undefined ? { jobLevel: dto.jobLevel } : {}),
            ...(dto.salesModel !== undefined ? { salesModel: dto.salesModel } : {}),
            ...(dto.salaryNegotiable !== undefined ? { salaryNegotiable: dto.salaryNegotiable } : {}),
            ...(dto.applicationDeadline !== undefined
              ? { applicationDeadline: dto.applicationDeadline ? new Date(dto.applicationDeadline) : null }
              : {}),
          },
          select: this.jobViewSelect,
        });
      },
      existing.id,
    );

    // Replace category join rows
    if (dto.categorySlugs !== undefined) {
      await this.prisma.jobCategoryOnJob.deleteMany({ where: { jobId: id } });
      if (dto.categorySlugs.length > 0) {
        const categories = await this.prisma.jobCategory.findMany({
          where: { slug: { in: dto.categorySlugs } },
          select: { id: true },
        });
        if (categories.length > 0) {
          await this.prisma.jobCategoryOnJob.createMany({
            data: categories.map(cat => ({ jobId: id, categoryId: cat.id })),
          });
        }
      }
    }

    // Replace customer type join rows
    if (dto.customerTypes !== undefined) {
      await this.prisma.jobCustomerTypeOnJob.deleteMany({ where: { jobId: id } });
      if (dto.customerTypes.length > 0) {
        await this.prisma.jobCustomerTypeOnJob.createMany({
          data: dto.customerTypes.map(type => ({ jobId: id, type })),
        });
      }
    }

    const response = this.toView(updated);
    this.homepageCache.clearAll();
    this.vectorSync.syncJob(updated.id).catch(err => this.logger.error('job_vector_sync_failed', err));
    return response;
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

    this.homepageCache.clearAll();
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

    const response = this.toView(updated);
    this.homepageCache.clearAll();
    return response;
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

    const response = this.toView(updated);
    this.homepageCache.clearAll();
    return response;
  }

  async saveJob(userId: string, jobId: string): Promise<SaveJobResponse> {
    await this.ensureUserOrThrow(userId);
    await this.ensureJobIsSavableOrThrow(userId, jobId);

    await this.prisma.savedJob.upsert({
      where: {
        userId_jobId: {
          userId,
          jobId,
        },
      },
      create: {
        userId,
        jobId,
      },
      update: {},
    });
    this.homepageCache.clearByUser(userId);
    return { jobId, isSaved: true };
  }

  async unsaveJob(userId: string, jobId: string): Promise<SaveJobResponse> {
    await this.ensureUserOrThrow(userId);
    await this.ensureJobIsSavableOrThrow(userId, jobId);

    await this.prisma.savedJob.deleteMany({
      where: {
        userId,
        jobId,
      },
    });
    this.homepageCache.clearByUser(userId);
    return { jobId, isSaved: false };
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
        salaryMin: true,
        salaryMax: true,
        salaryNegotiable: true,
        workingDayStatus: true,
        experienceLevel: true,
        minExperienceMonths: true,
        companyIndustryKey: true,
        jobFieldKey: true,
        jobLevel: true,
        salesModel: true,
        applicationDeadline: true,
      },
    });

    if (!job) {
      throw new ForbiddenException('You cannot access this job');
    }

    return job;
  }

  private buildListWhereLegacy(
    viewer: Viewer | null,
    q: string | undefined,
    status: JobStatus | undefined,
  ): Prisma.JobWhereInput {
    const searchFilter = q
      ? {
          OR: [
            {
              title: {
                contains: q,
                mode: Prisma.QueryMode.insensitive,
              },
            },
            {
              description: {
                contains: q,
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
        ...(status ? { status } : {}),
        ...searchFilter,
      };
    }

    return {
      status: JobStatus.PUBLISHED,
      deletedAt: null,
      ...searchFilter,
    };
  }

  private normalizeListQuery(query: QueryJobsDto): {
    q?: string;
    sort: JobsSort;
    employmentTypes?: string[];
    remote: JobsRemoteFilter;
    salaryMinGte?: number;
    salaryMaxLte?: number;
    postedWithinDays?: JobsPostedWithinDays;
    includeFacets: boolean;
    status?: JobStatus;
    categorySlugs?: string[];
    experienceLevels?: string[];
    companyIndustryKeys?: string[];
    jobFieldKeys?: string[];
    companyTypes?: string[];
    salaryBands?: string[];
    jobLevels?: string[];
    salesModels?: string[];
    customerTypes?: string[];
    workingDayStatus?: string;
    searchScope?: string;
    location?: string;
  } {
    const q = (query.q ?? query.search)?.trim() || undefined;
    if (q && this.isSensitiveQuery(q)) {
      throw new BadRequestException(
        'Query text is not allowed. Please remove personal contact details.',
      );
    }
    if (
      query.salaryMinGte !== undefined &&
      query.salaryMaxLte !== undefined &&
      query.salaryMinGte > query.salaryMaxLte
    ) {
      throw new BadRequestException(
        'salaryMinGte must be less than or equal to salaryMaxLte',
      );
    }

    const sort = JOB_SORT_VALUES.includes(query.sort ?? 'newest')
      ? (query.sort ?? 'newest')
      : 'newest';
    const remote = query.remote ?? 'any';
    const employmentTypes = query.employmentTypes
      ?.map((value) => value.trim().toUpperCase())
      .filter(Boolean)
      .slice(0, 10);
    const postedWithinDays =
      query.postedWithinDays !== undefined &&
      JOB_POSTED_WITHIN_DAYS_VALUES.includes(query.postedWithinDays as any)
        ? query.postedWithinDays
        : undefined;

    const workingDayStatus =
      query.workingDayStatus &&
      (WORKING_DAY_STATUS_VALUES as readonly string[]).includes(
        query.workingDayStatus,
      )
        ? query.workingDayStatus
        : undefined;

    const searchScope =
      query.searchScope &&
      (['job', 'company', 'both'] as readonly string[]).includes(
        query.searchScope,
      )
        ? query.searchScope
        : undefined;

    return {
      ...(q ? { q } : {}),
      sort,
      ...(employmentTypes && employmentTypes.length > 0
        ? { employmentTypes }
        : {}),
      remote,
      ...(query.salaryMinGte !== undefined
        ? { salaryMinGte: query.salaryMinGte }
        : {}),
      ...(query.salaryMaxLte !== undefined
        ? { salaryMaxLte: query.salaryMaxLte }
        : {}),
      ...(postedWithinDays !== undefined ? { postedWithinDays } : {}),
      includeFacets: query.includeFacets === true,
      ...(query.status ? { status: query.status } : {}),
      ...(query.categorySlugs?.length
        ? { categorySlugs: query.categorySlugs }
        : {}),
      ...(query.experienceLevels?.length
        ? { experienceLevels: query.experienceLevels }
        : {}),
      ...(query.companyIndustryKeys?.length
        ? { companyIndustryKeys: query.companyIndustryKeys }
        : {}),
      ...(query.jobFieldKeys?.length
        ? { jobFieldKeys: query.jobFieldKeys }
        : {}),
      ...(query.companyTypes?.length
        ? { companyTypes: query.companyTypes }
        : {}),
      ...(query.salaryBands?.length
        ? { salaryBands: query.salaryBands }
        : {}),
      ...(query.jobLevels?.length ? { jobLevels: query.jobLevels } : {}),
      ...(query.salesModels?.length
        ? { salesModels: query.salesModels }
        : {}),
      ...(query.customerTypes?.length
        ? { customerTypes: query.customerTypes }
        : {}),
      ...(workingDayStatus ? { workingDayStatus } : {}),
      ...(searchScope ? { searchScope } : {}),
      ...(query.location ? { location: query.location } : {}),
    };
  }

  private buildListWhereV1(
    viewer: Viewer | null,
    query: {
      q?: string;
      employmentTypes?: string[];
      remote: JobsRemoteFilter;
      salaryMinGte?: number;
      salaryMaxLte?: number;
      postedWithinDays?: JobsPostedWithinDays;
      status?: JobStatus;
      categorySlugs?: string[];
      experienceLevels?: string[];
      companyIndustryKeys?: string[];
      jobFieldKeys?: string[];
      companyTypes?: string[];
      salaryBands?: string[];
      jobLevels?: string[];
      salesModels?: string[];
      customerTypes?: string[];
      workingDayStatus?: string;
      searchScope?: string;
      location?: string;
    },
  ): Prisma.JobWhereInput {
    const andFilters: Prisma.JobWhereInput[] = [];

    // Search with scope support
    if (query.q) {
      const searchScope = query.searchScope ?? 'job';
      if (searchScope === 'company') {
        andFilters.push({
          company: {
            name: { contains: query.q, mode: Prisma.QueryMode.insensitive },
          },
        });
      } else if (searchScope === 'both') {
        andFilters.push({
          OR: [
            { title: { contains: query.q, mode: Prisma.QueryMode.insensitive } },
            { description: { contains: query.q, mode: Prisma.QueryMode.insensitive } },
            { company: { name: { contains: query.q, mode: Prisma.QueryMode.insensitive } } },
          ],
        });
      } else {
        // 'job' scope - default behavior
        andFilters.push({
          OR: [
            { title: { contains: query.q, mode: Prisma.QueryMode.insensitive } },
            { description: { contains: query.q, mode: Prisma.QueryMode.insensitive } },
          ],
        });
      }
    }

    if (query.employmentTypes?.length) {
      andFilters.push({
        employmentType: {
          in: query.employmentTypes,
          mode: Prisma.QueryMode.insensitive,
        },
      });
    }

    if (query.remote === 'true' || query.remote === 'false') {
      andFilters.push({
        location: {
          path: ['remote'],
          equals: query.remote === 'true',
        },
      });
    }

    if (query.salaryMinGte !== undefined) {
      andFilters.push({
        OR: [{ salaryMax: { gte: query.salaryMinGte } }, { salaryMax: null }],
      });
    }
    if (query.salaryMaxLte !== undefined) {
      andFilters.push({
        OR: [{ salaryMin: { lte: query.salaryMaxLte } }, { salaryMin: null }],
      });
    }

    if (query.postedWithinDays !== undefined) {
      andFilters.push({
        publishedAt: {
          gte: new Date(
            Date.now() - query.postedWithinDays * 24 * 60 * 60 * 1000,
          ),
        },
      });
    }

    // Category filter (relation)
    if (query.categorySlugs?.length) {
      andFilters.push({
        jobCategories: {
          some: {
            category: {
              slug: { in: query.categorySlugs },
            },
          },
        },
      });
    }

    // Customer type filter (relation)
    if (query.customerTypes?.length) {
      andFilters.push({
        jobCustomerTypes: {
          some: {
            type: { in: query.customerTypes, mode: Prisma.QueryMode.insensitive },
          },
        },
      });
    }

    // Scalar filters
    if (query.workingDayStatus && query.workingDayStatus !== 'any') {
      andFilters.push({ workingDayStatus: query.workingDayStatus });
    }
    if (query.experienceLevels?.length) {
      andFilters.push({ experienceLevel: { in: query.experienceLevels } });
    }
    if (query.companyIndustryKeys?.length) {
      andFilters.push({ companyIndustryKey: { in: query.companyIndustryKeys } });
    }
    if (query.jobFieldKeys?.length) {
      andFilters.push({ jobFieldKey: { in: query.jobFieldKeys } });
    }
    if (query.jobLevels?.length) {
      andFilters.push({ jobLevel: { in: query.jobLevels } });
    }
    if (query.salesModels?.length) {
      andFilters.push({ salesModel: { in: query.salesModels } });
    }

    // Company type filter (through company relation)
    if (query.companyTypes?.length) {
      andFilters.push({
        company: {
          companyType: { in: query.companyTypes },
        },
      });
    }

    // Salary band filter
    if (query.salaryBands?.length) {
      const bandOr: Prisma.JobWhereInput[] = [];
      for (const band of query.salaryBands) {
        if (band === 'negotiable') {
          bandOr.push({ salaryNegotiable: true });
        } else {
          const range = SALARY_BAND_RANGES[band as keyof typeof SALARY_BAND_RANGES];
          if (range) {
            const rangeAnd: Prisma.JobWhereInput[] = [];
            if (range.min !== undefined) {
              rangeAnd.push({
                OR: [{ salaryMax: { gte: range.min } }, { salaryMax: null }],
              });
            }
            if (range.maxExclusive !== undefined) {
              rangeAnd.push({
                OR: [{ salaryMin: { lt: range.maxExclusive } }, { salaryMin: null }],
              });
            }
            if (rangeAnd.length > 0) {
              bandOr.push({ AND: rangeAnd });
            }
          }
        }
      }
      if (bandOr.length > 0) {
        andFilters.push({ OR: bandOr });
      }
    }

    // Location filter
    if (query.location) {
      andFilters.push({
        location: {
          path: ['city'],
          equals: query.location,
        },
      });
    }

    if (viewer?.role === UserRole.RECRUITER) {
      return {
        recruiterId: viewer.sub,
        deletedAt: null,
        ...(query.status ? { status: query.status } : {}),
        ...(andFilters.length > 0 ? { AND: andFilters } : {}),
      };
    }

    return {
      status: JobStatus.PUBLISHED,
      deletedAt: null,
      ...(andFilters.length > 0 ? { AND: andFilters } : {}),
    };
  }

  private buildOrderBy(
    sort: JobsSort,
  ): Prisma.JobOrderByWithRelationInput[] | Prisma.JobOrderByWithRelationInput {
    if (sort === 'salary_asc') {
      return [
        { salaryMin: 'asc' },
        { salaryMax: 'asc' },
        { publishedAt: 'desc' },
        { createdAt: 'desc' },
      ];
    }
    if (sort === 'salary_desc') {
      return [
        { salaryMax: 'desc' },
        { salaryMin: 'desc' },
        { publishedAt: 'desc' },
        { createdAt: 'desc' },
      ];
    }
    if (sort === 'deadline_soon') {
      return [
        { applicationDeadline: 'asc' },
        { publishedAt: 'desc' },
        { createdAt: 'desc' },
      ];
    }
    if (sort === 'relevance') {
      return [{ publishedAt: 'desc' }, { createdAt: 'desc' }];
    }
    return [{ publishedAt: 'desc' }, { createdAt: 'desc' }];
  }

  private async computeFacets(
    where: Prisma.JobWhereInput,
  ): Promise<NonNullable<JobsListResponse['facets']>> {
    const [
      categoryRows,
      workingDayRows,
      experienceRows,
      industryRows,
      jobFieldRows,
      companyTypeRows,
      salaryBandRows,
      jobLevelRows,
      employmentTypeRows,
      salesModelRows,
      customerTypeRows,
      locationRows,
    ] = await Promise.all([
      // Categories via join table
      this.prisma.jobCategoryOnJob.groupBy({
        by: ['categoryId'],
        where: { job: where },
        _count: { _all: true },
      }),
      // Working day status
      this.prisma.job.groupBy({
        by: ['workingDayStatus'],
        where: { ...where, workingDayStatus: { not: null } },
        _count: { _all: true },
      }),
      // Experience level
      this.prisma.job.groupBy({
        by: ['experienceLevel'],
        where: { ...where, experienceLevel: { not: null } },
        _count: { _all: true },
      }),
      // Company industry key
      this.prisma.job.groupBy({
        by: ['companyIndustryKey'],
        where: { ...where, companyIndustryKey: { not: null } },
        _count: { _all: true },
      }),
      // Job field key
      this.prisma.job.groupBy({
        by: ['jobFieldKey'],
        where: { ...where, jobFieldKey: { not: null } },
        _count: { _all: true },
      }),
      // Company type (through company)
      this.prisma.company.groupBy({
        by: ['companyType'],
        where: { jobs: { some: where } },
        _count: { _all: true },
      }),
      // For salary bands, we need to compute from Job directly
      this.prisma.job.findMany({
        where,
        select: { salaryMin: true, salaryMax: true, salaryNegotiable: true },
        take: 5000,
      }),
      // Job level
      this.prisma.job.groupBy({
        by: ['jobLevel'],
        where: { ...where, jobLevel: { not: null } },
        _count: { _all: true },
      }),
      // Employment type
      this.prisma.job.groupBy({
        by: ['employmentType'],
        where,
        _count: { _all: true },
      }),
      // Sales model
      this.prisma.job.groupBy({
        by: ['salesModel'],
        where: { ...where, salesModel: { not: null } },
        _count: { _all: true },
      }),
      // Customer types via join table
      this.prisma.jobCustomerTypeOnJob.groupBy({
        by: ['type'],
        where: { job: where },
        _count: { _all: true },
      }),
      // Cities from location JSON
      this.prisma.job.findMany({
        where,
        select: { location: true },
        take: 2000,
      }),
    ]);

    // Resolve category names
    const categoryIds = categoryRows.map(r => r.categoryId);
    const categoryMap = categoryIds.length > 0
      ? new Map(
          (await this.prisma.jobCategory.findMany({
            where: { id: { in: categoryIds } },
            select: { id: true, slug: true, name: true },
          })).map(c => [c.id, c])
        )
      : new Map();

    const categories = categoryRows
      .map(row => {
        const cat = categoryMap.get(row.categoryId);
        return cat
          ? { value: cat.slug, label: cat.name, count: row._count._all }
          : null;
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
      .sort((a, b) => b.count - a.count);

    // Helper to map groupBy results
    const mapGroupBy = <T extends { _count: { _all: number } }>(
      rows: T[],
      getValue: (row: T) => string | null,
    ) =>
      rows
        .map(row => ({ value: getValue(row) ?? '', count: row._count._all }))
        .filter(e => e.value && e.count > 0)
        .sort((a, b) => b.count - a.count);

    const workingDayStatus = mapGroupBy(workingDayRows, r => r.workingDayStatus);
    const experienceLevels = mapGroupBy(experienceRows, r => r.experienceLevel);
    const companyIndustryKeys = mapGroupBy(industryRows, r => r.companyIndustryKey);
    const jobFieldKeys = mapGroupBy(jobFieldRows, r => r.jobFieldKey);
    const companyTypes = mapGroupBy(companyTypeRows, r => r.companyType);
    const jobLevels = mapGroupBy(jobLevelRows, r => r.jobLevel);
    const employmentTypes = mapGroupBy(employmentTypeRows, r => r.employmentType);
    const salesModels = mapGroupBy(salesModelRows, r => r.salesModel);
    const customerTypes = mapGroupBy(customerTypeRows, r => r.type);

    // Compute salary band counts
    const salaryBandCounts = new Map<string, number>();
    for (const job of salaryBandRows) {
      const bands = this.resolveSalaryBands(job.salaryMin, job.salaryMax, job.salaryNegotiable);
      for (const band of bands) {
        salaryBandCounts.set(band, (salaryBandCounts.get(band) ?? 0) + 1);
      }
    }
    const salaryBands = Array.from(salaryBandCounts.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count);

    // City counts from JSON location
    const cityCounts = new Map<string, number>();
    for (const row of locationRows) {
      const location = this.asRecord(row.location);
      const cityValue = this.clampString(location['city'], 120);
      if (cityValue) {
        cityCounts.set(cityValue, (cityCounts.get(cityValue) ?? 0) + 1);
      }
    }
    const cities = Array.from(cityCounts.entries())
      .map(([value, count]) => ({ value, count }))
      .filter(e => e.count >= 1)
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    return {
      categories,
      workingDayStatus,
      experienceLevels,
      companyIndustryKeys,
      jobFieldKeys,
      companyTypes,
      salaryBands,
      jobLevels,
      employmentTypes,
      salesModels,
      customerTypes,
      cities,
    };
  }

  private resolveSalaryBands(
    salaryMin: number | null,
    salaryMax: number | null,
    salaryNegotiable: boolean,
  ): string[] {
    const bands: string[] = [];

    if (salaryNegotiable || (salaryMin === null && salaryMax === null)) {
      bands.push('negotiable');
      return bands;
    }

    const min = salaryMin ?? 0;
    const max = salaryMax ?? Infinity;

    // Each band: job range overlaps [bandMin, bandMax)
    // Exclusive upper bound prevents double-counting at exact boundaries
    if (max <= 10_000_000) bands.push('under_10');
    if (min < 15_000_000 && max > 10_000_000) bands.push('10_15');
    if (min < 20_000_000 && max > 15_000_000) bands.push('15_20');
    if (min < 25_000_000 && max > 20_000_000) bands.push('20_25');
    if (min < 30_000_000 && max > 25_000_000) bands.push('25_30');
    if (min < 50_000_000 && max > 30_000_000) bands.push('30_50');
    if (max > 50_000_000) bands.push('over_50');

    return bands;
  }

  private isFeatureEnabled(envKey: string): boolean {
    const value = process.env[envKey];
    return value === '1' || value === 'true' || value === 'yes';
  }

  private isSensitiveQuery(query: string): boolean {
    const normalized = query.trim().toLowerCase();
    const hasEmail = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/.test(normalized);
    const hasPhone = /(?:\+?\d[\s.-]?){9,}/.test(normalized);
    return hasEmail || hasPhone;
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

  private async ensureUserOrThrow(userId: string): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
      select: { id: true },
    });
    if (!user) {
      throw new UnauthorizedException('User account not found');
    }
  }

  private async ensureJobIsSavableOrThrow(
    userId: string,
    jobId: string,
  ): Promise<void> {
    const [user, job] = await Promise.all([
      this.prisma.user.findFirst({
        where: {
          id: userId,
          deletedAt: null,
        },
        select: {
          id: true,
          role: true,
        },
      }),
      this.prisma.job.findFirst({
        where: {
          id: jobId,
          deletedAt: null,
        },
        select: {
          id: true,
          recruiterId: true,
          status: true,
        },
      }),
    ]);

    if (!user) {
      throw new UnauthorizedException('User account not found');
    }
    if (!job) {
      throw new NotFoundException('Job not found');
    }

    const isOwnRecruiterDraft =
      user.role === UserRole.RECRUITER &&
      job.recruiterId === user.id &&
      job.status !== JobStatus.PUBLISHED;
    if (job.status !== JobStatus.PUBLISHED && !isOwnRecruiterDraft) {
      throw new NotFoundException('Job not found');
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
    company: {
      name: string;
      logoUrl: string | null;
      iconKey: string | null;
      companyType: string | null;
    } | null;
    title: string;
    slug: string;
    description: string;
    skills: Prisma.JsonValue;
    location: Prisma.JsonValue | null;
    requirementsSchema: Prisma.JsonValue | null;
    requirementsSchemaVersion: string | null;
    salaryMin: number | null;
    salaryMax: number | null;
    salaryNegotiable?: boolean | null;
    employmentType: string;
    workingDayStatus?: string | null;
    experienceLevel?: string | null;
    minExperienceMonths?: number | null;
    companyIndustryKey?: string | null;
    jobFieldKey?: string | null;
    jobLevel?: string | null;
    salesModel?: string | null;
    applicationDeadline?: Date | null;
    status: JobStatus;
    publishedAt: Date | null;
    closedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    jobCategories?: Array<{
      category: { slug: string; name: string };
    }>;
    jobCustomerTypes?: Array<{ type: string }>;
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
            skills: this.readPersistedOrNormalizedSkills(
              item.skills,
              item.location,
            ),
            location: item.location,
          });

    return {
      ...item,
      companyName: item.company?.name ?? null,
      companyLogoUrl: item.company?.logoUrl ?? null,
      companyIconKey: item.company?.iconKey ?? null,
      companyType: item.company?.companyType ?? null,
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
      workingDayStatus: item.workingDayStatus ?? null,
      experienceLevel: item.experienceLevel ?? null,
      minExperienceMonths: item.minExperienceMonths ?? null,
      companyIndustryKey: item.companyIndustryKey ?? null,
      jobFieldKey: item.jobFieldKey ?? null,
      jobLevel: item.jobLevel ?? null,
      salesModel: item.salesModel ?? null,
      salaryNegotiable: item.salaryNegotiable ?? false,
      applicationDeadline: item.applicationDeadline ?? null,
      categorySlugs: item.jobCategories?.map(jc => jc.category.slug) ?? [],
      customerTypes: item.jobCustomerTypes?.map(jct => jct.type) ?? [],
    };
  }

  private get jobViewSelect() {
    return {
      id: true,
      recruiterId: true,
      company: {
        select: {
          name: true,
          logoUrl: true,
          iconKey: true,
          companyType: true,
        },
      },
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
      salaryNegotiable: true,
      employmentType: true,
      workingDayStatus: true,
      experienceLevel: true,
      minExperienceMonths: true,
      companyIndustryKey: true,
      jobFieldKey: true,
      jobLevel: true,
      salesModel: true,
      applicationDeadline: true,
      status: true,
      publishedAt: true,
      closedAt: true,
      createdAt: true,
      updatedAt: true,
      jobCategories: {
        select: {
          category: {
            select: { slug: true, name: true },
          },
        },
      },
      jobCustomerTypes: {
        select: { type: true },
      },
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
    const normalizedProfile = this.asRecord(normalization['normalizedProfile']);
    return this.jobRequirementsSchemaService.createV2({
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
