import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { DashboardShell } from '@/components/auth/dashboard-shell';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api-client';
import { getMyCvs, type CvItem } from '@/lib/cv-client';
import {
  listRecommendationScans,
  type RecommendationScanListItem,
  type RecommendationScanListResponse,
} from '@/lib/recommendation-client';
import { RecommendationStartForm } from './recommendation-start-form';
import { ScanResultsSection } from './scan-results-section';

export default async function RecommendationsPage({
  searchParams,
}: {
  searchParams: Promise<{ scanId?: string }>;
}) {
  const session = await auth();
  if (!session?.user || !session.accessToken) redirect('/login');
  if (session.user.role !== 'CANDIDATE') redirect('/dashboard');

  const params = await searchParams;
  let cvs: CvItem[] = [];
  let scans: RecommendationScanListResponse | null = null;
  let errorMessage = '';

  try {
    const [cvsResponse, scansResponse] = await Promise.all([
      getMyCvs(session.accessToken),
      listRecommendationScans(session.accessToken),
    ]);
    cvs = cvsResponse.items;
    scans = scansResponse;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) redirect('/api/auth/logout');
    errorMessage =
      error instanceof ApiError
        ? error.message
        : 'Failed to load data';
  }

  return (
    <DashboardShell
      title="Smart Job Match"
      description="Analyze your CV against all jobs on the platform to find the best matching positions."
      email={session.user.email}
      userName={session.user.name}
      userAvatarUrl={session.user.image}
      role="CANDIDATE"
      currentPath="/dashboard/candidate/recommendations"
    >
      {errorMessage ? (
        <Alert className="mb-4">{errorMessage}</Alert>
      ) : null}

      {/* Start New Scan */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Start New Analysis</h2>
        {cvs.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
            <p className="mb-2">You don&apos;t have any CVs yet. Please upload a CV first.</p>
            <Button asChild>
              <Link href="/dashboard/candidate/cvs">Upload CV</Link>
            </Button>
          </div>
        ) : (
          <RecommendationStartForm
            cvs={cvs}
            accessToken={session.accessToken}
          />
        )}
      </section>

      {/* Active scan results */}
      {params.scanId ? (
        <ScanResultsSection
          scanId={params.scanId}
          accessToken={session.accessToken}
        />
      ) : null}

      {/* Scan History */}
      {scans && scans.items.length > 0 ? (
        <section>
          <h2 className="text-lg font-semibold mb-3">Analysis History</h2>
          <div className="space-y-3">
            {scans.items.map((scan) => (
              <ScanHistoryCard key={scan.id} scan={scan} />
            ))}
          </div>
        </section>
      ) : null}

      {/* Back link */}
      <div className="mt-6">
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/candidate">← Back to Dashboard</Link>
        </Button>
      </div>
    </DashboardShell>
  );
}

function ScanHistoryCard({
  scan,
}: {
  scan: RecommendationScanListItem;
}) {
  const statusConfig = {
    PROCESSING: { label: 'Processing...', variant: 'info' as const },
    COMPLETED: { label: 'Completed', variant: 'default' as const },
    FAILED: { label: 'Failed', variant: 'danger' as const },
  };
  const config = statusConfig[scan.status];

  return (
    <Link
      href={`/dashboard/candidate/recommendations?scanId=${scan.id}`}
      className="block rounded-lg border p-4 hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant={config.variant}>{config.label}</Badge>
            {scan.topScore !== null ? (
              <span className="text-sm font-medium">
                Top score: {Math.round(scan.topScore)}%
              </span>
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground">
            {scan.resultCount} results from {scan.totalJobs} jobs
            {scan.processingMs
              ? ` · ${(scan.processingMs / 1000).toFixed(1)}s`
              : ''}
          </p>
        </div>
        <time className="text-xs text-muted-foreground">
          {new Date(scan.createdAt).toLocaleString('vi-VN')}
        </time>
      </div>
    </Link>
  );
}
