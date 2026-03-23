import { Injectable } from '@nestjs/common';
import { JobStatus, Prisma } from '@prisma/client';
import type { JwtPayload } from '../auth/auth.types';
import { PrismaService } from '../prisma/prisma.service';
import { HomepageCacheService } from './homepage-cache.service';
import type {
  HomepageCategory,
  HomepageFeaturedJob,
  HomepageFooter,
  HomepageResponse,
  HomepageTrendPoint,
  HomepageIndustryDemandPoint,
  HomepageLocationFilter,
} from './homepage.types';

const HERO_FALLBACK = {
  headline: 'Find Your Dream Job',
  subheadline:
    'Over 500,000 active job openings from top-tier companies and innovative startups worldwide.',
  backgroundImageUrl:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDfgq41SCyJjCh8zdZiRw6w8jt0VVFLbbLZt7ykfAFG5aMhH40ASM8UMZ9MfGO8putfc51TN2a1kZKzgL-xf1h2OCA2zfSWVROPUmoryvq3LWede7BycCZTqzh84lcsbOCYi2E_Uci0U4tKT8uz1n9flsEcFS-JQpNGsZwDylU6idlM9bD_qSH0Ka99HwwLlw_9-MwVTdiTw3FGdxMlEg-6TyTfakh-LEv5JrJRl1lGhd3E8PBaADKLpsv489FaNa0QW7cfRgIorbk',
  popularKeywords: [
    'Software Engineer',
    'Product Designer',
    'Marketing Manager',
  ],
};

const FOOTER_FALLBACK: HomepageFooter = {
  quickLinks: [
    { label: 'Browse Jobs', href: '/jobs' },
    { label: 'Company Profile', href: '#' },
    { label: 'Job Notifications', href: '#' },
    { label: 'Career Advice', href: '#' },
  ],
  supportLinks: [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Cookie Policy', href: '#' },
    { label: 'Help Center', href: '#' },
  ],
  socialLinks: [
    { platform: 'linkedin', href: '#' },
    { platform: 'twitter', href: '#' },
    { platform: 'instagram', href: '#' },
    { platform: 'facebook', href: '#' },
  ],
  copyrightText: '© 2023 SCC Smart Career Connector. All rights reserved.',
};

@Injectable()
export class HomepageService {
  private readonly cacheTtlMs =
    Number(process.env['API_HOME_CACHE_TTL_MS'] ?? '120000') || 120000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly homepageCache: HomepageCacheService,
  ) {}

  async getHomepage(
    viewer: JwtPayload | null,
    location: string | undefined,
  ): Promise<HomepageResponse> {
    const cacheKey = `home:${location ?? 'all'}:u:${viewer?.sub ?? 'guest'}`;
    const cached = this.homepageCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const [
      content,
      latestStat,
      trendRows,
      featuredRows,
      trustedCompanies,
      categoryRows,
    ] = await Promise.all([
      this.prisma.homepageContent.findUnique({ where: { slug: 'home-main' } }),
      this.prisma.marketStatDaily.findFirst({ orderBy: { statDate: 'desc' } }),
      this.prisma.marketStatDaily.findMany({
        orderBy: { statDate: 'desc' },
        take: 6,
      }),
      this.prisma.job.findMany({
        where: {
          status: JobStatus.PUBLISHED,
          deletedAt: null,
        },
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
        take: 6,
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
          shortDescription: true,
          salaryMin: true,
          salaryMax: true,
          location: true,
          company: {
            select: {
              name: true,
              logoUrl: true,
              iconKey: true,
            },
          },
        },
      }),
      this.prisma.company.findMany({
        where: {
          isTrusted: true,
          jobs: {
            some: {
              status: JobStatus.PUBLISHED,
              deletedAt: null,
            },
          },
        },
        select: {
          id: true,
          name: true,
          logoUrl: true,
          iconKey: true,
        },
        orderBy: { name: 'asc' },
        take: 10,
      }),
      this.prisma.jobCategory.findMany({
        select: {
          id: true,
          slug: true,
          name: true,
          iconKey: true,
          jobs: {
            where: {
              status: JobStatus.PUBLISHED,
              deletedAt: null,
            },
            select: { id: true },
          },
        },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        take: 8,
      }),
    ]);

    const trend = trendRows
      .slice()
      .reverse()
      .map<HomepageTrendPoint>((row) => ({
        date: row.statDate.toISOString().slice(0, 10),
        value: row.newJobs24h,
      }));

    const demandByIndustry = await this.getDemandByIndustry(
      latestStat?.statDate ?? null,
    );
    const locationFilters = await this.getLocationFilters();
    const categories = categoryRows.map<HomepageCategory>((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      iconKey: row.iconKey,
      openJobsCount: row.jobs.length,
    }));

    const savedJobIds = viewer
      ? new Set(
          (
            await this.prisma.savedJob.findMany({
              where: {
                userId: viewer.sub,
                jobId: { in: featuredRows.map((job) => job.id) },
              },
              select: { jobId: true },
            })
          ).map((row) => row.jobId),
        )
      : new Set<string>();

    const featuredJobs = featuredRows.map<HomepageFeaturedJob>((job) => ({
      id: job.id,
      slug: job.slug,
      title: job.title,
      companyName: job.company?.name ?? 'Confidential Company',
      companyLogoUrl: job.company?.logoUrl ?? null,
      companyIconKey: job.company?.iconKey ?? null,
      shortDescription: this.resolveShortDescription(
        job.shortDescription,
        job.description,
      ),
      salaryText: this.toSalaryText(job.salaryMin, job.salaryMax),
      locationLabel: this.toLocationLabel(job.location),
      isSaved: savedJobIds.has(job.id),
    }));

    const currentUser = viewer
      ? await this.resolveCurrentUser(viewer.sub)
      : null;

    const response: HomepageResponse = {
      currentUser,
      hero: {
        headline: content?.heroHeadline ?? HERO_FALLBACK.headline,
        subheadline: content?.heroSubheadline ?? HERO_FALLBACK.subheadline,
        backgroundImageUrl:
          content?.heroBackgroundImageUrl ?? HERO_FALLBACK.backgroundImageUrl,
        popularKeywords:
          this.readStringArray(content?.popularKeywords) ??
          HERO_FALLBACK.popularKeywords,
      },
      marketStats: {
        asOfDate:
          latestStat?.statDate.toISOString().slice(0, 10) ??
          new Date().toISOString().slice(0, 10),
        newJobs24h: latestStat?.newJobs24h ?? 0,
        activeJobs: latestStat?.activeJobs ?? 0,
        hiringCompanies: latestStat?.hiringCompanies ?? 0,
      },
      jobGrowthSeries: trend,
      demandByIndustry,
      trustedCompanies: trustedCompanies.map((company) => ({
        companyId: company.id,
        name: company.name,
        logoUrl: company.logoUrl,
        brandIconKey: company.iconKey,
      })),
      categories,
      locationFilters,
      featuredJobs,
      footer: {
        quickLinks:
          this.readFooterLinks(content?.footerQuickLinks) ??
          FOOTER_FALLBACK.quickLinks,
        supportLinks:
          this.readFooterLinks(content?.footerSupportLinks) ??
          FOOTER_FALLBACK.supportLinks,
        socialLinks:
          this.readSocialLinks(content?.footerSocialLinks) ??
          FOOTER_FALLBACK.socialLinks,
        copyrightText: FOOTER_FALLBACK.copyrightText,
      },
      generatedAt: new Date().toISOString(),
    };

    this.homepageCache.set(cacheKey, response, this.cacheTtlMs);
    return response;
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  invalidateAllCache(): void {
    this.homepageCache.clearAll();
  }

  invalidateUserCache(userId: string): void {
    this.homepageCache.clearByUser(userId);
  }

  private async resolveCurrentUser(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        avatar: true,
        planName: true,
      },
    });
    if (!user) {
      return null;
    }

    const unreadNotificationCount = await this.getUnreadNotificationCount(
      user.id,
    );
    return {
      id: user.id,
      name: user.name,
      avatarUrl: user.avatar,
      planName: user.planName,
      unreadNotificationCount,
    };
  }

  private async getDemandByIndustry(
    statDate: Date | null,
  ): Promise<HomepageIndustryDemandPoint[]> {
    if (!statDate) {
      return [];
    }
    const rows = await this.prisma.industryDemandDaily.findMany({
      where: { statDate },
      orderBy: [{ sortOrder: 'asc' }, { demandValue: 'desc' }],
      take: 6,
    });
    return rows.map((row, index) => ({
      industryKey: row.industryKey,
      label: row.industryLabel,
      value: row.demandValue,
      order: row.sortOrder || index + 1,
    }));
  }

  private async getLocationFilters(): Promise<HomepageLocationFilter[]> {
    const jobs = await this.prisma.job.findMany({
      where: {
        status: JobStatus.PUBLISHED,
        deletedAt: null,
      },
      select: {
        location: true,
      },
      take: 2000,
    });
    const counters = new Map<string, number>();
    for (const job of jobs) {
      const label = this.toLocationLabel(job.location);
      if (!label || label === 'Remote') {
        continue;
      }
      counters.set(label, (counters.get(label) ?? 0) + 1);
    }

    return Array.from(counters.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([label, jobCount]) => ({
        label,
        slug: this.toSlug(label),
        jobCount,
      }));
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
      return `${this.toCompactMillions(min)} - ${this.toCompactMillions(max)} million VND`;
    }
    if (min !== null) {
      return `From ${this.toCompactMillions(min)} million VND`;
    }
    if (max !== null) {
      return `Up to ${this.toCompactMillions(max)} million VND`;
    }
    return 'Negotiable';
  }

  private toCompactMillions(value: number): string {
    const million = value / 1_000_000;
    return Number.isInteger(million) ? String(million) : million.toFixed(1);
  }

  private toSlug(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  private resolveShortDescription(
    shortDescription: string | null,
    description: string,
  ): string {
    if (shortDescription && shortDescription.trim().length > 0) {
      return shortDescription.trim().slice(0, 180);
    }
    return description.trim().slice(0, 180);
  }

  private readStringArray(
    value: Prisma.JsonValue | null | undefined,
  ): string[] | null {
    if (!Array.isArray(value)) {
      return null;
    }
    const items = value
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean);
    return items.length > 0 ? items : null;
  }

  private readFooterLinks(
    value: Prisma.JsonValue | null | undefined,
  ): Array<{ label: string; href: string }> | null {
    if (!Array.isArray(value)) {
      return null;
    }
    const links = value
      .map((item) => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
          return null;
        }
        const record = item as Record<string, unknown>;
        const label =
          typeof record['label'] === 'string' ? record['label'] : '';
        const href = typeof record['href'] === 'string' ? record['href'] : '#';
        return label ? { label, href } : null;
      })
      .filter((item): item is { label: string; href: string } => item !== null);

    return links.length > 0 ? links : null;
  }

  private readSocialLinks(
    value: Prisma.JsonValue | null | undefined,
  ): Array<{ platform: string; href: string }> | null {
    if (!Array.isArray(value)) {
      return null;
    }
    const links = value
      .map((item) => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
          return null;
        }
        const record = item as Record<string, unknown>;
        const platform =
          typeof record['platform'] === 'string' ? record['platform'] : '';
        const href = typeof record['href'] === 'string' ? record['href'] : '#';
        return platform ? { platform, href } : null;
      })
      .filter(
        (item): item is { platform: string; href: string } => item !== null,
      );

    return links.length > 0 ? links : null;
  }
}
