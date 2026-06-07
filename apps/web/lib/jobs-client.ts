import { createApiError } from './api-client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export type JobStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'ARCHIVED';

export type RequirementItemV1 = {
  id: string;
  label: string;
  category: 'skill' | 'experience' | 'education' | 'language' | 'location' | 'certification' | 'general';
  importance: 'must_have' | 'nice_to_have';
  keywords: string[];
  minimumMonths: number | null;
};

export type RequirementItemV2 = {
  id: string;
  label: string;
  category: 'skill' | 'experience' | 'education' | 'language' | 'location' | 'certification' | 'general';
  importance: 'critical' | 'high' | 'medium' | 'low' | 'very_low';
  keywords: string[];
  minimumMonths: number | null;
};

export type ConstraintItem = {
  id: string;
  label: string;
  type: 'education' | 'certification' | 'experience_years' | 'language' | 'location' | 'other';
  required: boolean;
};

export type RequirementsSchemaV1 = {
  version: 'requirements_schema_v1';
  roleTitle: string;
  summary: string;
  mustHaves: RequirementItemV1[];
  niceToHaves: RequirementItemV1[];
  locationPreference: {
    city: string;
    country: string;
    remote: boolean;
  } | null;
  warnings: string[];
};

export type RequirementsSchemaV2 = {
  version: 'requirements_schema_v2';
  roleTitle: string;
  summary: string;
  requirements: RequirementItemV2[];
  constraints: ConstraintItem[];
  locationPreference: {
    city: string;
    country: string;
    remote: boolean;
  } | null;
  warnings: string[];
};

export type RequirementsSchema = RequirementsSchemaV1 | RequirementsSchemaV2;

export type JobItem = {
  id: string;
  recruiterId: string;
  companyName: string | null;
  companyLogoUrl: string | null;
  companyIconKey: string | null;
  title: string;
  slug: string;
  description: string;
  skills: string[];
  certifications?: string[];
  inputMode: 'manual' | 'file_upload';
  parseStatus: 'parsed_ok' | 'needs_review';
  parseTelemetry: {
    provider: 'gemini' | 'openai';
    model: string;
    latencyMs: number;
  } | null;
  normalizedProfile: {
    title: string;
    summary: string;
    skills: string[];
    jobMeta?: {
      requirements: string[];
      benefits: string[];
      employmentType: string;
    };
  } | null;
  requirementsSchema: RequirementsSchema | null;
  requirementsSchemaVersion: string | null;
  location: Record<string, unknown> | null;
  salaryMin: number | null;
  salaryMax: number | null;
  employmentType: string;
  status: JobStatus;
  publishedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  // Filter metadata fields
  workingDayStatus?: string | null;
  experienceLevel?: string | null;
  minExperienceMonths?: number | null;
  companyIndustryKey?: string | null;
  jobFieldKey?: string | null;
  jobLevel?: string | null;
  salesModel?: string | null;
  salaryNegotiable?: boolean;
  applicationDeadline?: string | null;
  companyType?: string | null;
  categorySlugs?: string[];
  customerTypes?: string[];
};

export type JobsListResponse = {
  items: JobItem[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
  meta?: {
    sort: JobsSort;
    appliedFilters: {
      q?: string;
      employmentTypes?: string[];
      remote?: JobsRemoteFilter;
      salaryMinGte?: number;
      salaryMaxLte?: number;
      postedWithinDays?: 1 | 3 | 7 | 14 | 30;
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
    };
  };
  facets?: {
    categories: Array<{ value: string; label: string; count: number }>;
    workingDayStatus: Array<{ value: string; count: number }>;
    experienceLevels: Array<{ value: string; count: number }>;
    companyIndustryKeys: Array<{ value: string; count: number }>;
    jobFieldKeys: Array<{ value: string; count: number }>;
    companyTypes: Array<{ value: string; count: number }>;
    salaryBands: Array<{ value: string; count: number }>;
    jobLevels: Array<{ value: string; count: number }>;
    employmentTypes: Array<{ value: string; count: number }>;
    salesModels: Array<{ value: string; count: number }>;
    customerTypes: Array<{ value: string; count: number }>;
    cities: Array<{ value: string; count: number }>;
  };
};

export type JobsSort = 'newest' | 'salary_asc' | 'salary_desc' | 'deadline_soon' | 'relevance';
export type JobsRemoteFilter = 'any' | 'true' | 'false';

export type JobsQuery = {
  page?: number;
  limit?: number;
  search?: string;
  q?: string;
  sort?: JobsSort;
  employmentTypes?: string[];
  remote?: JobsRemoteFilter;
  salaryMinGte?: number;
  salaryMaxLte?: number;
  postedWithinDays?: 1 | 3 | 7 | 14 | 30;
  includeFacets?: boolean;
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
};

type RequestOptions = {
  token?: string;
  contentTypeJson?: boolean;
};

async function apiRequest<T>(
  path: string,
  init: RequestInit,
  options?: RequestOptions,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(options?.contentTypeJson ? { 'Content-Type': 'application/json' } : {}),
      ...(options?.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(init.headers ?? {}),
    },
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

export function buildJobsSearchParams(query?: JobsQuery): URLSearchParams {
  const params = new URLSearchParams();
  const page = query?.page ?? 1;
  const limit = query?.limit ?? 20;
  params.set('page', String(page));
  params.set('limit', String(limit));
  if (query?.q) params.set('q', query.q);
  if (query?.search) params.set('search', query.search);
  if (query?.sort && query.sort !== 'newest') params.set('sort', query.sort);
  if (query?.employmentTypes?.length) {
    params.set('employmentTypes', query.employmentTypes.join(','));
  }
  if (query?.remote && query.remote !== 'any') params.set('remote', query.remote);
  if (query?.salaryMinGte !== undefined) {
    params.set('salaryMinGte', String(query.salaryMinGte));
  }
  if (query?.salaryMaxLte !== undefined) {
    params.set('salaryMaxLte', String(query.salaryMaxLte));
  }
  if (query?.postedWithinDays !== undefined) {
    params.set('postedWithinDays', String(query.postedWithinDays));
  }
  if (query?.includeFacets) {
    params.set('includeFacets', 'true');
  }
  if (query?.status) params.set('status', query.status);
  if (query?.categorySlugs?.length) params.set('categorySlugs', query.categorySlugs.join(','));
  if (query?.experienceLevels?.length) params.set('experienceLevels', query.experienceLevels.join(','));
  if (query?.companyIndustryKeys?.length) params.set('companyIndustryKeys', query.companyIndustryKeys.join(','));
  if (query?.jobFieldKeys?.length) params.set('jobFieldKeys', query.jobFieldKeys.join(','));
  if (query?.companyTypes?.length) params.set('companyTypes', query.companyTypes.join(','));
  if (query?.salaryBands?.length) params.set('salaryBands', query.salaryBands.join(','));
  if (query?.jobLevels?.length) params.set('jobLevels', query.jobLevels.join(','));
  if (query?.salesModels?.length) params.set('salesModels', query.salesModels.join(','));
  if (query?.customerTypes?.length) params.set('customerTypes', query.customerTypes.join(','));
  if (query?.workingDayStatus) params.set('workingDayStatus', query.workingDayStatus);
  if (query?.searchScope) params.set('searchScope', query.searchScope);
  if (query?.location) params.set('location', query.location);
  return params;
}

export function getJobs(query?: JobsQuery, token?: string) {
  const params = buildJobsSearchParams(query);
  return apiRequest<JobsListResponse>(`/jobs?${params.toString()}`, { method: 'GET' }, { token });
}

export function getJobDetail(idOrSlug: string, token?: string) {
  return apiRequest<JobItem>(`/jobs/${idOrSlug}`, { method: 'GET' }, { token });
}

export function createJob(
  token: string,
  payload: {
    title: string;
    description: string;
    skills: string[];
    certifications?: string[];
    employmentType: string;
    salaryMin?: number;
    salaryMax?: number;
    categorySlugs?: string[];
    workingDayStatus?: string;
    experienceLevel?: string;
    minExperienceMonths?: number;
    companyIndustryKey?: string;
    jobFieldKey?: string;
    jobLevel?: string;
    salesModel?: string;
    customerTypes?: string[];
    salaryNegotiable?: boolean;
    applicationDeadline?: string;
  },
) {
  return apiRequest<JobItem>(
    '/jobs',
    { method: 'POST', body: JSON.stringify(payload) },
    { token, contentTypeJson: true },
  );
}

export function uploadJobFile(token: string, formData: FormData) {
  return apiRequest<JobItem>(
    '/jobs/upload',
    { method: 'POST', body: formData },
    { token },
  );
}

export function updateJob(
  token: string,
  jobId: string,
  payload: Partial<{
    title: string;
    description: string;
    skills: string[];
    certifications: string[];
    employmentType: string;
    salaryMin: number;
    salaryMax: number;
    categorySlugs: string[];
    workingDayStatus: string;
    experienceLevel: string;
    minExperienceMonths: number;
    companyIndustryKey: string;
    jobFieldKey: string;
    jobLevel: string;
    salesModel: string;
    customerTypes: string[];
    salaryNegotiable: boolean;
    applicationDeadline: string;
  }>,
) {
  return apiRequest<JobItem>(
    `/jobs/${jobId}`,
    { method: 'PATCH', body: JSON.stringify(payload) },
    { token, contentTypeJson: true },
  );
}

export function deleteJob(token: string, jobId: string) {
  return apiRequest<{ success: true }>(
    `/jobs/${jobId}`,
    { method: 'DELETE' },
    { token },
  );
}

export function publishJob(token: string, jobId: string) {
  return apiRequest<JobItem>(
    `/jobs/${jobId}/publish`,
    { method: 'POST' },
    { token },
  );
}

export function closeJob(token: string, jobId: string) {
  return apiRequest<JobItem>(
    `/jobs/${jobId}/close`,
    { method: 'POST' },
    { token },
  );
}
