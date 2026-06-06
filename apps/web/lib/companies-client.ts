import { createApiError } from './api-client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export type CompanyJob = {
  id: string;
  slug: string;
  title: string;
  location: string;
  salary: string;
  postedAt: string;
  tags: string[];
};

export type CompanyItem = {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  website: string | null;
  taxCode: string | null;
  size: string | null;
  industry: string | null;
  companyType: string;
  priorityRank: number;
  isTrusted: boolean;
  jobsCount: number;
  location: string | null;
  shortDescription: string | null;
  description: string[];
  highlights: string[];
  recentJobs: CompanyJob[];
};

export type CompaniesListResponse = {
  items: CompanyItem[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
};

export type CompaniesQuery = {
  page?: number;
  limit?: number;
  q?: string;
  type?: string;
};

async function apiRequest<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'GET',
    cache: 'no-store',
  });
  const body = (await response.json().catch(() => null)) as
    | {
        message?: string | string[];
        code?: string;
        requestId?: string;
        details?: unknown;
      }
    | null;

  if (!response.ok) {
    throw createApiError(response.status, body);
  }

  return body as T;
}

function buildCompaniesSearchParams(query?: CompaniesQuery): URLSearchParams {
  const params = new URLSearchParams();
  params.set('page', String(query?.page ?? 1));
  params.set('limit', String(query?.limit ?? 20));
  if (query?.q) params.set('q', query.q);
  if (query?.type) params.set('type', query.type);
  return params;
}

export function getCompanies(query?: CompaniesQuery) {
  const params = buildCompaniesSearchParams(query);
  return apiRequest<CompaniesListResponse>(`/companies?${params.toString()}`);
}

export function getCompanyDetail(slug: string) {
  return apiRequest<CompanyItem>(`/companies/${slug}`);
}

