import { createApiError } from './api-client';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export type HomepageCurrentUser = {
  id: string;
  name: string;
  avatarUrl: string | null;
  planName: string;
  unreadNotificationCount: number;
};

export type HomepageHeroSection = {
  headline: string;
  subheadline: string;
  backgroundImageUrl: string;
  popularKeywords: string[];
};

export type HomepageMarketStats = {
  asOfDate: string;
  newJobs24h: number;
  activeJobs: number;
  hiringCompanies: number;
};

export type HomepageTrendPoint = {
  date: string;
  value: number;
};

export type HomepageIndustryDemandPoint = {
  industryKey: string;
  label: string;
  value: number;
  order: number;
};

export type HomepageTrustedCompany = {
  companyId: string;
  name: string;
  logoUrl: string | null;
  brandIconKey: string | null;
};

export type HomepageCategory = {
  id: string;
  slug: string;
  name: string;
  iconKey: string;
  openJobsCount: number;
};

export type HomepageLocationFilter = {
  slug: string;
  label: string;
  jobCount: number;
};

export type HomepageFeaturedJob = {
  id: string;
  slug: string;
  title: string;
  companyName: string;
  companyLogoUrl: string | null;
  companyIconKey: string | null;
  shortDescription: string;
  salaryText: string;
  locationLabel: string;
  isSaved: boolean;
};

export type HomepageFooterLink = {
  label: string;
  href: string;
};

export type HomepageSocialLink = {
  platform: string;
  href: string;
};

export type HomepageFooter = {
  quickLinks: HomepageFooterLink[];
  supportLinks: HomepageFooterLink[];
  socialLinks: HomepageSocialLink[];
  copyrightText: string;
};

export type HomepageResponse = {
  currentUser: HomepageCurrentUser | null;
  hero: HomepageHeroSection;
  marketStats: HomepageMarketStats;
  jobGrowthSeries: HomepageTrendPoint[];
  demandByIndustry: HomepageIndustryDemandPoint[];
  trustedCompanies: HomepageTrustedCompany[];
  categories: HomepageCategory[];
  locationFilters: HomepageLocationFilter[];
  featuredJobs: HomepageFeaturedJob[];
  footer: HomepageFooter;
  generatedAt: string;
};

export type SaveJobResponse = {
  jobId: string;
  isSaved: boolean;
};

type ApiErrorBody = {
  message?: string | string[];
  code?: string;
  requestId?: string;
  details?: unknown;
};

async function apiRequest<T>(
  path: string,
  init: RequestInit,
  options?: { token?: string },
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(options?.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(init.headers ?? {}),
    },
    cache: 'no-store',
  });
  const body = (await response.json().catch(() => null)) as ApiErrorBody | null;
  if (!response.ok) {
    throw createApiError(response.status, body);
  }
  return body as T;
}

export function getHomepage(options?: { location?: string; token?: string }) {
  const params = new URLSearchParams();
  if (options?.location) {
    params.set('location', options.location);
  }
  const query = params.toString();
  return apiRequest<HomepageResponse>(
    `/home${query ? `?${query}` : ''}`,
    {
      method: 'GET',
    },
    { token: options?.token },
  );
}

export function saveHomepageJob(jobId: string, token: string) {
  return apiRequest<SaveJobResponse>(
    `/jobs/${jobId}/save`,
    { method: 'POST' },
    { token },
  );
}

export function unsaveHomepageJob(jobId: string, token: string) {
  return apiRequest<SaveJobResponse>(
    `/jobs/${jobId}/save`,
    { method: 'DELETE' },
    { token },
  );
}

export function getUnreadNotificationCount(token: string) {
  return apiRequest<{ unreadCount: number }>(
    '/notifications/unread-count',
    { method: 'GET' },
    { token },
  );
}
