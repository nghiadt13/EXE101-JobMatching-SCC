import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JobStatus, Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJobDto } from './dto/create-job.dto';
import { QueryJobsDto } from './dto/query-jobs.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JobsListResponse, JobView } from './jobs.types';
import { JobSlugService } from './services/job-slug.service';

type Viewer = {
  sub: string;
  role: UserRole;
};

@Injectable()
export class JobsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jobSlugService: JobSlugService,
  ) {}

  async create(recruiterId: string, dto: CreateJobDto): Promise<JobView> {
    this.validateSalaryRange(dto.salaryMin, dto.salaryMax);
    const slug = await this.jobSlugService.generateUniqueSlug(dto.title);

    try {
      const created = await this.prisma.job.create({
        data: {
          recruiterId,
          title: dto.title,
          slug,
          description: dto.description,
          skills: this.normalizeSkills(dto.skills) as Prisma.InputJsonValue,
          ...(dto.location !== undefined
            ? { location: dto.location as Prisma.InputJsonValue }
            : {}),
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
                skills: this.normalizeSkills(
                  dto.skills,
                ) as Prisma.InputJsonValue,
              }
            : {}),
          ...(dto.location !== undefined
            ? { location: dto.location as Prisma.InputJsonValue }
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
    await this.getRecruiterOwnedJobOrThrow(recruiterId, id);
    await this.prisma.job.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
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
    return {
      ...item,
      skills: Array.isArray(item.skills) ? (item.skills as string[]) : [],
      location:
        item.location &&
        typeof item.location === 'object' &&
        !Array.isArray(item.location)
          ? (item.location as Record<string, unknown>)
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
}
