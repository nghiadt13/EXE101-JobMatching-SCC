'use client';

import { useState, useEffect } from 'react';
import type { CvSuggestion } from '@/lib/cv-client';
import type { JobItem, JobsListResponse } from '@/lib/jobs-client';
import { SuggestionScoreBar } from './suggestion-score-bar';
import { SuggestionKeywords } from './suggestion-keywords';
import { SuggestionSectionCard } from './suggestion-section-card';
import { SuggestionRewriteCard } from './suggestion-rewrite-card';

type Props = {
  cvId: string;
  accessToken: string;
  onApplyRewrite?: (section: string, newText: string) => void;
  onClose?: () => void;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export function AiSuggestionPanel({
  cvId,
  accessToken,
  onApplyRewrite,
  onClose,
}: Props) {
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [suggestion, setSuggestion] = useState<CvSuggestion | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch published jobs
  useEffect(() => {
    async function loadJobs() {
      try {
        const res = await fetch(
          `${API_BASE_URL}/jobs?status=PUBLISHED&limit=50&page=1`,
          {
            method: 'GET',
            headers: { Authorization: `Bearer ${accessToken}` },
            cache: 'no-store',
          },
        );
        if (!res.ok) throw new Error('Failed to load jobs');
        const data = (await res.json()) as JobsListResponse;
        setJobs(data.items);
      } catch {
        setError('Không thể tải danh sách việc làm.');
      } finally {
        setIsLoadingJobs(false);
      }
    }
    loadJobs();
  }, [accessToken]);

  const handleAnalyze = async () => {
    if (!selectedJobId || !cvId) return;
    setIsLoading(true);
    setError(null);
    setSuggestion(null);

    try {
      const res = await fetch(`${API_BASE_URL}/cvs/${cvId}/suggest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ jobId: selectedJobId }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const msg =
          typeof body?.message === 'string'
            ? body.message
            : 'AI suggestion failed';
        throw new Error(msg);
      }

      const data = (await res.json()) as CvSuggestion;
      setSuggestion(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Đã xảy ra lỗi. Vui lòng thử lại.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyRewrite = (section: string, newText: string) => {
    onApplyRewrite?.(section, newText);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 bg-linear-to-r from-violet-50 to-indigo-50 px-4 py-3">
        <h3 className="text-sm font-bold text-zinc-800">🤖 AI Gợi ý CV</h3>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-white/60 hover:text-zinc-700 transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Job selector */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-600">
            Chọn việc làm để so sánh
          </label>
          {isLoadingJobs ? (
            <div className="h-10 animate-pulse rounded-lg bg-zinc-100" />
          ) : (
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-700 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="">-- Chọn việc làm --</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title} - {job.companyName ?? 'Unknown'}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Analyze button */}
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={!selectedJobId || isLoading || !cvId}
          className="w-full rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition-all hover:from-violet-700 hover:to-indigo-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Đang phân tích... (5-15s)
            </span>
          ) : (
            '🔍 Phân tích CV'
          )}
        </button>

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            ⚠️ {error}
          </div>
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <div className="space-y-3">
            <div className="h-20 animate-pulse rounded-xl bg-zinc-100" />
            <div className="h-16 animate-pulse rounded-xl bg-zinc-100" />
            <div className="h-32 animate-pulse rounded-xl bg-zinc-100" />
            <div className="h-24 animate-pulse rounded-xl bg-zinc-100" />
          </div>
        )}

        {/* Results */}
        {suggestion && !isLoading && (
          <div className="space-y-4">
            {/* Score */}
            <SuggestionScoreBar score={suggestion.overallScore} />

            {/* Missing keywords */}
            <SuggestionKeywords keywords={suggestion.missingKeywords} />

            {/* Strength highlights */}
            {suggestion.strengthHighlights.length > 0 && (
              <div className="rounded-xl border border-zinc-200 bg-white p-4">
                <h4 className="mb-2.5 text-sm font-semibold text-zinc-800">
                  ✅ Điểm mạnh
                </h4>
                <ul className="space-y-1.5">
                  {suggestion.strengthHighlights.map((highlight, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-zinc-700">
                      <span className="mt-0.5 text-emerald-500">✓</span>
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Section suggestions */}
            {suggestion.sections.length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-semibold text-zinc-800">
                  📋 Gợi ý theo section
                </h4>
                <div className="space-y-2">
                  {suggestion.sections.map((section) => (
                    <SuggestionSectionCard key={section.section} data={section} />
                  ))}
                </div>
              </div>
            )}

            {/* Rewrite suggestions */}
            {suggestion.rewriteSuggestions.length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-semibold text-zinc-800">
                  ✏️ Gợi ý viết lại
                </h4>
                <div className="space-y-3">
                  {suggestion.rewriteSuggestions.map((rewrite, i) => (
                    <SuggestionRewriteCard
                      key={i}
                      data={rewrite}
                      onApply={onApplyRewrite ? handleApplyRewrite : undefined}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!suggestion && !isLoading && !error && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <span className="mb-3 text-4xl">💡</span>
            <p className="text-sm font-medium text-zinc-600">
              Chọn một việc làm để bắt đầu
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              AI sẽ phân tích CV của bạn và gợi ý cải thiện theo yêu cầu của việc làm.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
