import { Injectable, NotFoundException } from '@nestjs/common';
import { JobStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QueryCompaniesDto } from './dto/query-companies.dto';
import type {
  CompaniesListResponse,
  CompanyJobView,
  CompanyView,
} from './companies.types';

const companySelect = {
  id: true,
  name: true,
  slug: true,
  logoUrl: true,
  website: true,
  taxCode: true,
  size: true,
  industry: true,
  location: true,
  shortDescription: true,
  description: true,
  highlights: true,
  isTrusted: true,
  companyType: true,
  priorityRank: true,
  jobs: {
    where: {
      status: JobStatus.PUBLISHED,
      deletedAt: null,
    },
    orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    take: 5,
    select: {
      id: true,
      slug: true,
      title: true,
      skills: true,
      location: true,
      salaryMin: true,
      salaryMax: true,
      employmentType: true,
      experienceLevel: true,
      publishedAt: true,
      createdAt: true,
    },
  },
  _count: {
    select: {
      jobs: {
        where: {
          status: JobStatus.PUBLISHED,
          deletedAt: null,
        },
      },
    },
  },
} satisfies Prisma.CompanySelect;

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: QueryCompaniesDto): Promise<CompaniesListResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = this.buildWhere(query);

    const [items, totalItems] = await Promise.all([
      this.prisma.company.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [
          { priorityRank: 'asc' },
          { isTrusted: 'desc' },
          { updatedAt: 'desc' },
        ],
        select: companySelect,
      }),
      this.prisma.company.count({ where }),
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

  async getBySlug(slug: string): Promise<CompanyView> {
    const company = await this.prisma.company.findFirst({
      where: {
        slug,
      },
      select: companySelect,
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return this.toView(company);
  }

  private buildWhere(query: QueryCompaniesDto): Prisma.CompanyWhereInput {
    const and: Prisma.CompanyWhereInput[] = [];

    if (query.type) {
      and.push({ companyType: query.type });
    }

    const q = query.q?.trim();
    if (q) {
      and.push({
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { industry: { contains: q, mode: 'insensitive' } },
          { location: { contains: q, mode: 'insensitive' } },
          { shortDescription: { contains: q, mode: 'insensitive' } },
        ],
      });
    }

    return and.length ? { AND: and } : {};
  }

  private toView(item: CompanyRecord): CompanyView {
    return {
      id: item.id,
      slug: item.slug ?? item.id,
      name: item.name,
      logoUrl: item.logoUrl,
      website: item.website,
      taxCode: item.taxCode,
      size: item.size,
      industry: item.industry,
      companyType: item.companyType ?? 'normal',
      priorityRank: item.priorityRank,
      isTrusted: item.isTrusted,
      jobsCount: item._count.jobs,
      location: item.location,
      shortDescription: item.shortDescription,
      description: this.readStringArray(item.description),
      highlights: this.readStringArray(item.highlights),
      recentJobs: item.jobs.map((job) => this.toJobView(job)),
    };
  }

  private toJobView(job: CompanyJobRecord): CompanyJobView {
    return {
      id: job.id,
      slug: job.slug,
      title: job.title,
      location: this.toLocationLabel(job.location),
      salary: this.toSalaryText(job.salaryMin, job.salaryMax),
      postedAt: this.toPostedAt(job.publishedAt ?? job.createdAt),
      tags: [
        job.employmentType,
        job.experienceLevel,
        ...(Array.isArray(job.skills)
          ? job.skills.filter((skill): skill is string => typeof skill === 'string')
          : []),
      ]
        .filter((tag): tag is string => Boolean(tag))
        .slice(0, 4),
    };
  }

  private readStringArray(value: Prisma.JsonValue | null): string[] {
    if (!Array.isArray(value)) {
      return [];
    }
    return value
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private toLocationLabel(value: Prisma.JsonValue | null): string {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return 'Remote';
    }
    const record = value as Record<string, unknown>;
    if (record['remote'] === true) {
      return 'Remote';
    }
    const district =
      typeof record['district'] === 'string' ? record['district'].trim() : '';
    const city =
      typeof record['city'] === 'string' ? record['city'].trim() : '';
    const country =
      typeof record['country'] === 'string' ? record['country'].trim() : '';

    if (district && city) {
      return `${district}, ${city}`;
    }
    if (city) {
      return city;
    }
    if (country) {
      return country;
    }
    return 'Remote';
  }

  private toSalaryText(min: number | null, max: number | null): string {
    if (min !== null && max !== null) {
      return `${this.toCompactMillions(min)} - ${this.toCompactMillions(max)} triệu`;
    }
    if (min !== null) {
      return `Từ ${this.toCompactMillions(min)} triệu`;
    }
    if (max !== null) {
      return `Đến ${this.toCompactMillions(max)} triệu`;
    }
    return 'Thỏa thuận';
  }

  private toCompactMillions(value: number): string {
    const million = value / 1_000_000;
    return Number.isInteger(million) ? String(million) : million.toFixed(1);
  }

  private toPostedAt(date: Date): string {
    const diffMs = Date.now() - date.getTime();
    const days = Math.max(0, Math.floor(diffMs / 86_400_000));
    if (days === 0) return 'Hôm nay';
    if (days === 1) return '1 ngày trước';
    if (days < 7) return `${days} ngày trước`;
    return `${Math.floor(days / 7)} tuần trước`;
  }
}

type CompanyRecord = Prisma.CompanyGetPayload<{
  select: typeof companySelect;
}>;

type CompanyJobRecord = CompanyRecord['jobs'][number];
