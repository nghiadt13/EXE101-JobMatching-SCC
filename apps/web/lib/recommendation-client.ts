import { ApiError } from './api-client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export type MatchTier = 'excellent' | 'good' | 'potential' | 'low';

export const MATCH_TIER_CONFIG: Record<
  MatchTier,
  { label: string; emoji: string; color: string; bg: string; border: string }
> = {
  excellent: {
    label: 'Phù hợp nhất với bạn',
    emoji: '🟢',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50 border-emerald-200',
    border: 'border-emerald-200',
  },
  good: {
    label: 'Phù hợp',
    emoji: '🟡',
    color: 'text-amber-700',
    bg: 'bg-amber-50 border-amber-200',
    border: 'border-amber-200',
  },
  potential: {
    label: 'Có tiềm năng',
    emoji: '🟠',
    color: 'text-orange-700',
    bg: 'bg-orange-50 border-orange-200',
    border: 'border-orange-200',
  },
  low: {
    label: 'Ít phù hợp',
    emoji: '🔴',
    color: 'text-red-700',
    bg: 'bg-red-50 border-red-200',
    border: 'border-red-200',
  },
};

export type RecommendationResultItem = {
  id: string;
  rank: number;
  matchScore: number;
  matchTier: MatchTier;
  confidenceScore: number;
  strengths: string[];
  gaps: string[];
  job: {
    id: string;
    title: string;
    slug: string;
    employmentType: string;
    salaryMin: number | null;
    salaryMax: number | null;
    company: { name: string; logoUrl: string | null } | null;
  };
};

export type RecommendationScanResponse = {
  id: string;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  totalJobs: number;
  preFiltered: number;
  aiEvaluated: number;
  processingMs: number | null;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
  results: RecommendationResultItem[];
};

export type RecommendationScanListItem = {
  id: string;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  totalJobs: number;
  aiEvaluated: number;
  processingMs: number | null;
  createdAt: string;
  completedAt: string | null;
  resultCount: number;
  topScore: number | null;
};

export type RecommendationScanListResponse = {
  items: RecommendationScanListItem[];
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

export function startRecommendationScan(token: string, cvId: string) {
  return apiRequest<{ scanId: string }>(token, '/matching/recommend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cvId }),
  });
}

export function getRecommendationScan(token: string, scanId: string) {
  return apiRequest<RecommendationScanResponse>(
    token,
    `/matching/recommend/${scanId}`,
    { method: 'GET' },
  );
}

export function listRecommendationScans(token: string, page = 1) {
  return apiRequest<RecommendationScanListResponse>(
    token,
    `/matching/recommend?page=${page}&limit=5`,
    { method: 'GET' },
  );
}
