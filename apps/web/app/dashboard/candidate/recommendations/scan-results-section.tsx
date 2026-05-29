'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import {
  getRecommendationScan,
  MATCH_TIER_CONFIG,
  type RecommendationScanResponse,
  type RecommendationResultItem,
  type MatchTier,
} from '@/lib/recommendation-client';

const POLL_INTERVAL_MS = 3000;

export function ScanResultsSection({
  scanId,
  accessToken,
}: {
  scanId: string;
  accessToken: string;
}) {
  const [scan, setScan] = useState<RecommendationScanResponse | null>(null);
  const [error, setError] = useState('');

  const fetchScan = useCallback(async () => {
    try {
      const data = await getRecommendationScan(accessToken, scanId);
      setScan(data);
      return data.status;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Không thể tải kết quả phân tích',
      );
      return 'FAILED';
    }
  }, [accessToken, scanId]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const poll = async () => {
      const status = await fetchScan();
      if (status === 'PROCESSING') {
        timer = setTimeout(poll, POLL_INTERVAL_MS);
      }
    };

    poll();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [fetchScan]);

  if (error) {
    return (
      <section className="mb-8">
        <div className="rounded-lg border border-destructive p-4 text-destructive">
          {error}
        </div>
      </section>
    );
  }

  if (!scan) {
    return (
      <section className="mb-8">
        <div className="rounded-lg border p-6 text-center animate-pulse">
          <p className="text-muted-foreground">Đang tải kết quả...</p>
        </div>
      </section>
    );
  }

  if (scan.status === 'PROCESSING') {
    return (
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">
          Đang phân tích...
        </h2>
        <div className="rounded-lg border p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-4 w-4 rounded-full bg-blue-500 animate-pulse" />
            <p className="font-medium">Hệ thống đang xử lý CV của bạn</p>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              So sánh với{' '}
              {scan.totalJobs > 0
                ? `${scan.totalJobs} việc làm`
                : 'tất cả việc làm'}
              ...
            </p>
            {scan.preFiltered > 0 ? (
              <p>Đã lọc {scan.preFiltered} việc làm tiềm năng</p>
            ) : null}
            {scan.aiEvaluated > 0 ? (
              <p>
                AI đã đánh giá: {scan.aiEvaluated}/{scan.preFiltered || '?'}
              </p>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Quá trình này có thể mất 30-60 giây. Bạn có thể rời khỏi trang này
            — bạn sẽ được thông báo khi kết quả sẵn sàng.
          </p>
        </div>
      </section>
    );
  }

  if (scan.status === 'FAILED') {
    return (
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Phân tích thất bại</h2>
        <div className="rounded-lg border border-destructive p-4">
          <p className="text-destructive">
            {scan.errorMessage || 'Đã xảy ra lỗi. Vui lòng thử lại.'}
          </p>
        </div>
      </section>
    );
  }

  // COMPLETED
  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">
          Kết quả phân tích
        </h2>
        <div className="text-sm text-muted-foreground">
          {scan.aiEvaluated} việc làm đã đánh giá từ {scan.totalJobs} tổng số ·{' '}
          {scan.processingMs
            ? `${(scan.processingMs / 1000).toFixed(1)}s`
            : ''}
        </div>
      </div>

      {scan.results.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
          <p>Không tìm thấy việc làm phù hợp. Hãy cập nhật CV và quét lại.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {scan.results.map((result) => (
            <RecommendationCard key={result.id} result={result} />
          ))}
        </div>
      )}
    </section>
  );
}

function RecommendationCard({
  result,
}: {
  result: RecommendationResultItem;
}) {
  const tier = MATCH_TIER_CONFIG[result.matchTier as MatchTier] ??
    MATCH_TIER_CONFIG.low;

  return (
    <div className={`rounded-lg border p-5 ${tier.bg}`}>
      <div className="flex items-start justify-between gap-4">
        {/* Left: Job info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-muted-foreground">
              #{result.rank}
            </span>
            <Link
              href={`/jobs/${result.job.slug}`}
              className="text-base font-semibold hover:underline truncate"
            >
              {result.job.title}
            </Link>
          </div>
          {result.job.company ? (
            <p className="text-sm text-muted-foreground mb-2">
              {result.job.company.name}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant="outline">{result.job.employmentType}</Badge>
            {result.job.salaryMin || result.job.salaryMax ? (
              <Badge variant="outline">
                {result.job.salaryMin
                  ? `${(result.job.salaryMin / 1000000).toFixed(0)}M`
                  : ''}
                {result.job.salaryMin && result.job.salaryMax ? ' - ' : ''}
                {result.job.salaryMax
                  ? `${(result.job.salaryMax / 1000000).toFixed(0)}M`
                  : ''}
              </Badge>
            ) : null}
          </div>
        </div>

        {/* Right: Score */}
        <div className="text-right shrink-0">
          <div className="text-2xl font-bold">
            {Math.round(result.matchScore)}%
          </div>
          <div className={`text-xs font-medium ${tier.color}`}>
            {tier.emoji} {tier.label}
          </div>
          {result.confidenceScore > 0 ? (
            <div className="text-xs text-muted-foreground mt-1">
              Độ tin cậy:{' '}
              {result.matchScore >= 60 && result.confidenceScore >= 0.7
                ? 'Cao'
                : result.matchScore >= 40 && result.confidenceScore >= 0.4
                  ? 'Trung bình'
                  : 'Thấp'}
            </div>
          ) : null}
        </div>
      </div>

      {/* Strengths & Gaps */}
      <div className="mt-3 flex flex-col sm:flex-row gap-3">
        {result.strengths.length > 0 ? (
          <div className="flex-1">
            <p className="text-xs font-medium text-emerald-700 mb-1">
              Điểm mạnh
            </p>
            <ul className="text-xs text-muted-foreground space-y-0.5">
              {result.strengths.map((s, i) => (
                <li key={i}>• {s}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {result.gaps.length > 0 ? (
          <div className="flex-1">
            <p className="text-xs font-medium text-orange-700 mb-1">
              Điểm cần cải thiện
            </p>
            <ul className="text-xs text-muted-foreground space-y-0.5">
              {result.gaps.map((g, i) => (
                <li key={i}>• {g}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      {/* Actions */}
      <div className="mt-3 flex gap-2">
        <Link
          href={`/jobs/${result.job.slug}`}
          className="text-xs font-medium text-primary hover:underline"
        >
          Xem chi tiết →
        </Link>
      </div>
    </div>
  );
}
