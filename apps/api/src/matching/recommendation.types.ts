export type MatchTier = 'excellent' | 'good' | 'potential' | 'low';

export function resolveMatchTier(score: number): MatchTier {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'potential';
  return 'low';
}

export const MATCH_TIER_LABELS: Record<MatchTier, string> = {
  excellent: 'Rất phù hợp',
  good: 'Phù hợp',
  potential: 'Có tiềm năng',
  low: 'Ít phù hợp',
};

export interface RecommendationResultView {
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
}

export interface RecommendationScanView {
  id: string;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  totalJobs: number;
  preFiltered: number;
  aiEvaluated: number;
  processingMs: number | null;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
  results: RecommendationResultView[];
}

export interface RecommendationScanListItem {
  id: string;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  totalJobs: number;
  aiEvaluated: number;
  processingMs: number | null;
  createdAt: string;
  completedAt: string | null;
  resultCount: number;
  topScore: number | null;
}
