import { ApiError } from './api-client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export type ApplicationStatus =
  | 'APPLIED'
  | 'REVIEWING'
  | 'INTERVIEW'
  | 'OFFER'
  | 'REJECTED'
  | 'WITHDRAWN';

export type SchemaMatchingSnapshot = {
  version: 'schema_v1';
  scoreBreakdown: {
    mustHave: number;
    niceToHave: number;
    experience: number;
    education: number;
    language: number;
    location: number;
    final: number;
  };
  requirements: Array<{
    id: string;
    label: string;
    category: string;
    importance: 'must_have' | 'nice_to_have';
    status: 'met' | 'partial' | 'missing' | 'not_applicable';
    evidence: string[];
  }>;
  strengths: string[];
  gaps: string[];
  warnings: string[];
};

export type ApplicationItem = {
  id: string;
  jobId: string;
  candidateId: string;
  cvId: string;
  matchScore: number;
  matchingSnapshot: SchemaMatchingSnapshot | null;
  status: ApplicationStatus;
  notes: string | null;
  appliedAt: string;
  updatedAt: string;
  job: {
    id: string;
    title: string;
    slug: string;
  };
  candidate: {
    id: string;
    name: string;
    email: string;
  };
  cv: {
    id: string;
    fileName: string;
  };
};

export type ApplicationsListResponse = {
  items: ApplicationItem[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
};

async function apiRequest<T>(
  token: string,
  path: string,
  init: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
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

export function createApplication(
  token: string,
  payload: { jobId: string; cvId: string },
) {
  return apiRequest<ApplicationItem>(token, '/applications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function getApplications(
  token: string,
  query?: { page?: number; limit?: number; status?: ApplicationStatus; jobId?: string },
) {
  const params = new URLSearchParams();
  params.set('page', String(query?.page ?? 1));
  params.set('limit', String(query?.limit ?? 20));
  if (query?.status) params.set('status', query.status);
  if (query?.jobId) params.set('jobId', query.jobId);
  return apiRequest<ApplicationsListResponse>(
    token,
    `/applications?${params.toString()}`,
    { method: 'GET' },
  );
}

export function updateApplicationStatus(
  token: string,
  applicationId: string,
  payload: { status: Exclude<ApplicationStatus, 'WITHDRAWN'>; notes?: string },
) {
  return apiRequest<ApplicationItem>(token, `/applications/${applicationId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}
