'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { startRecommendationScan } from '@/lib/recommendation-client';
import type { CvItem } from '@/lib/cv-client';

export function RecommendationStartForm({
  cvs,
  accessToken,
}: {
  cvs: CvItem[];
  accessToken: string;
}) {
  const router = useRouter();
  const [selectedCvId, setSelectedCvId] = useState(
    cvs.find((cv) => cv.isPrimary)?.id ?? cvs[0]?.id ?? '',
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleStart = async () => {
    if (!selectedCvId) return;
    setIsLoading(true);
    setError('');
    try {
      const result = await startRecommendationScan(accessToken, selectedCvId);
      router.push(
        `/dashboard/candidate/recommendations?scanId=${result.scanId}`,
      );
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Không thể bắt đầu phân tích. Vui lòng thử lại.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-lg border p-5">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
        <div className="flex-1">
          <label
            htmlFor="cv-select"
            className="block text-sm font-medium mb-1.5"
          >
            Chọn CV để phân tích
          </label>
          <select
            id="cv-select"
            value={selectedCvId}
            onChange={(e) => setSelectedCvId(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm bg-background"
            disabled={isLoading}
          >
            {cvs.map((cv) => (
              <option key={cv.id} value={cv.id}>
                {cv.fileName}
                {cv.isPrimary ? ' (Primary)' : ''}
              </option>
            ))}
          </select>
        </div>
        <Button
          onClick={handleStart}
          disabled={isLoading || !selectedCvId}
          className="whitespace-nowrap"
        >
          {isLoading ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              Đang gửi...
            </>
          ) : (
            '🚀 Bắt đầu phân tích'
          )}
        </Button>
      </div>
      {error ? (
        <p className="text-sm text-destructive mt-2">{error}</p>
      ) : null}
      <p className="text-xs text-muted-foreground mt-3">
        Hệ thống sẽ so sánh CV của bạn với tất cả công việc đang tuyển và đưa
        ra top 10 vị trí phù hợp nhất. Quá trình này có thể mất 30-60 giây.
      </p>
    </div>
  );
}
