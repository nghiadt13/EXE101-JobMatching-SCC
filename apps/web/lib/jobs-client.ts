import { ApiError } from './api-client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export type JobStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'ARCHIVED';

export type JobItem = {
  id: string;
  recruiterId: string;
  title: string;
  slug: string;
  description: string;
  skills: string[];
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
  location: Record<string, unknown> | null;
  salaryMin: number | null;
  salaryMax: number | null;
  employmentType: string;
  status: JobStatus;
  publishedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type JobsListResponse = {
  items: JobItem[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
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
    | { message?: string | string[] }
    | null;

  if (!response.ok) {
    const message =
      typeof body?.message === 'string'
        ? body.message
        : Array.isArray(body?.message)
          ? body.message[0]
          : 'Request failed';
    throw new ApiError(message, response.status);
  }

  return body as T;
}

export function getJobs(
  query?: { page?: number; limit?: number; search?: string; status?: JobStatus },
  token?: string,
) {
  const params = new URLSearchParams();
  params.set('page', String(query?.page ?? 1));
  params.set('limit', String(query?.limit ?? 20));
  if (query?.search) params.set('search', query.search);
  if (query?.status) params.set('status', query.status);
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
    employmentType: string;
    salaryMin?: number;
    salaryMax?: number;
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
    employmentType: string;
    salaryMin: number;
    salaryMax: number;
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
