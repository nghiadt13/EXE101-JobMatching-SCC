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
        : 'Không thể tải dữ liệu';
  }

  return (
    <DashboardShell
      title="Ghép việc làm thông minh"
      description="Phân tích CV của bạn với tất cả việc làm trên nền tảng để tìm vị trí phù hợp nhất."
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
        <h2 className="text-lg font-semibold mb-3">Bắt đầu phân tích mới</h2>
        {cvs.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
            <p className="mb-2">Bạn chưa có CV nào. Vui lòng tải CV lên trước.</p>
            <Button asChild>
              <Link href="/dashboard/candidate/cvs">Tải CV lên</Link>
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
          <h2 className="text-lg font-semibold mb-3">Lịch sử phân tích</h2>
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
          <Link href="/dashboard/candidate">← Quay lại bảng điều khiển</Link>
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
    PROCESSING: { label: 'Đang xử lý...', variant: 'info' as const },
    COMPLETED: { label: 'Hoàn thành', variant: 'default' as const },
    FAILED: { label: 'Thất bại', variant: 'danger' as const },
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
                Điểm cao nhất: {Math.round(scan.topScore)}%
              </span>
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground">
            {scan.resultCount} kết quả từ {scan.totalJobs} việc làm
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
