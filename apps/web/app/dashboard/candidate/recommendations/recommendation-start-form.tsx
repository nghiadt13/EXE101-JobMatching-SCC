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
          : 'Unable to start analysis. Please try again.',
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
            Select a CV to analyze
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
              Submitting...
            </>
          ) : (
            'Start Analysis'
          )}
        </Button>
      </div>
      {error ? (
        <p className="text-sm text-destructive mt-2">{error}</p>
      ) : null}
      <p className="text-xs text-muted-foreground mt-3">
        The system will compare your CV against all active job listings and
        recommend the top 10 best-matching positions. This may take 30-60 seconds.
      </p>
    </div>
  );
}
