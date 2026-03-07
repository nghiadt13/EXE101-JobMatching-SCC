import { createApiError } from './api-client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export type CandidateProfile = {
  version: 'candidate_profile_v1';
  headline: string;
  summary: string;
  skills: string[];
  experience: Array<{
    role: string;
    company: string;
    startDate: string | null;
    endDate: string | null;
    tech: string[];
  }>;
  education: Array<{
    school: string;
    degree: string;
    field: string;
    startDate: string | null;
    endDate: string | null;
  }>;
  certifications: string[];
  languages: string[];
  projects: Array<{
    name: string;
    description: string;
    tech: string[];
  }>;
  location: { city: string; country: string } | null;
  warnings: string[];
};

export type CvItem = {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
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
    certifications: string[];
    languages: string[];
    projects: Array<{
      name: string;
      description: string;
      tech: string[];
    }>;
    experience: Array<Record<string, unknown>>;
    education: Array<Record<string, unknown>>;
    location?: { city: string; country: string };
  } | null;
  candidateProfile: CandidateProfile | null;
  candidateProfileVersion: string | null;
  parsedData: {
    skills: string[];
    summary?: string;
    [key: string]: unknown;
  };
  skills: string[];
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CvListResponse = {
  items: CvItem[];
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

export function getMyCvs(token: string) {
  return apiRequest<CvListResponse>(token, '/cvs?page=1&limit=50', {
    method: 'GET',
  });
}

export function uploadCv(token: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return apiRequest<CvItem>(token, '/cvs/upload', {
    method: 'POST',
    body: formData,
  });
}

export function updateCv(
  token: string,
  cvId: string,
  payload: { skills?: string[]; parsedData?: Record<string, unknown> },
) {
  return apiRequest<CvItem>(token, `/cvs/${cvId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

export function deleteCv(token: string, cvId: string) {
  return apiRequest<{ success: true }>(token, `/cvs/${cvId}`, {
    method: 'DELETE',
  });
}

export function setPrimaryCv(token: string, cvId: string) {
  return apiRequest<CvItem>(token, `/cvs/${cvId}/set-primary`, {
    method: 'POST',
  });
}
