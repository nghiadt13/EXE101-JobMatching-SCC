import { createApiError } from './api-client';
import type { CvBuilderData } from '@/types/cv-builder';

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
  parseStatus: 'parsed_ok' | 'needs_review' | 'pending_apply';
  parseTelemetry: {
    provider: 'gemini' | 'openai' | 'kimi' | 'deepseek';
    model: string;
    latencyMs: number;
  } | null;
  normalizedProfile: {
    candidateName?: string;
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
  candidate?: {
    phone: string | null;
    location: any;
    user: {
      name: string;
      email: string;
      avatar: string | null;
    };
  } | null;
  parsedData: {
    skills: string[];
    summary?: string;
    builderData?: CvBuilderData;
    [key: string]: unknown;
  };
  skills: string[];
  source: string;
  templateId: string;
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

export function getCvById(token: string, cvId: string) {
  return apiRequest<CvItem>(token, `/cvs/${cvId}`, {
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

export function createBuilderCv(token: string, data: CvBuilderData) {
  return apiRequest<CvItem>(token, '/cvs/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export function updateBuilderCv(token: string, cvId: string, data: CvBuilderData) {
  return apiRequest<CvItem>(token, `/cvs/${cvId}/builder`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
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

// ─── AI CV Suggestion ─────────────────────────────────────────

export type SectionSuggestion = {
  section: string;
  suggestions: string[];
  priority: 'high' | 'medium' | 'low';
};

export type RewriteSuggestion = {
  section: string;
  original: string;
  suggested: string;
  reason: string;
};

export type CvSuggestion = {
  overallScore: number;
  missingKeywords: string[];
  strengthHighlights: string[];
  sections: SectionSuggestion[];
  rewriteSuggestions: RewriteSuggestion[];
};

export function suggestCv(token: string, cvId: string, jobId: string) {
  return apiRequest<CvSuggestion>(token, `/cvs/${cvId}/suggest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobId }),
  });
}

export async function fetchCvFile(token: string, cvId: string): Promise<Blob> {
  const res = await fetch(`${API_BASE_URL}/cvs/${cvId}/file`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw createApiError(res.status, body);
  }
  return res.blob();
}
