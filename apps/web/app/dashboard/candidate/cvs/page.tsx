import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { DashboardShell } from '@/components/auth/dashboard-shell';
import { CvPageContent } from '@/components/cv/cv-page-content';
import { CvSidebarWidgets } from '@/components/cv/cv-sidebar-widgets';
import { SiteFooter } from '@/components/layout/site-footer';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api-client';
import { buildErrorRedirectPath, resolveRouteError } from '@/lib/errors/backend-error-state';
import { deleteCv, getMyCvs, setPrimaryCv, updateCv } from '@/lib/cv-client';

type PageProps = {
  searchParams: Promise<{ error?: string; message?: string; requestId?: string; returnTo?: string }>;
};

export default async function CandidateCvsPage({ searchParams }: PageProps) {
  const query = await searchParams;
  const session = await auth();
  if (!session?.user || !session.accessToken) redirect('/login');
  if (session.user.role !== 'CANDIDATE') redirect('/dashboard');

  // Validate returnTo
  const rawReturnTo = query.returnTo;
  const returnTo =
    rawReturnTo &&
    rawReturnTo.startsWith('/') &&
    !rawReturnTo.startsWith('//') &&
    !rawReturnTo.includes(':')
      ? rawReturnTo
      : null;

  async function setPrimaryAction(cvId: string) {
    'use server';
    const currentSession = await auth();
    if (!currentSession?.user || !currentSession.accessToken) redirect('/login');
    try {
      await setPrimaryCv(currentSession.accessToken, cvId);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) redirect('/api/auth/logout');
    }
    revalidatePath('/', 'layout');
  }

  async function deleteAction(cvId: string) {
    'use server';
    const currentSession = await auth();
    if (!currentSession?.user || !currentSession.accessToken) redirect('/login');
    try {
      await deleteCv(currentSession.accessToken, cvId);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) redirect('/api/auth/logout');
    }
    revalidatePath('/', 'layout');
  }

  async function renameAction(cvId: string, newTitle: string) {
    'use server';
    const currentSession = await auth();
    if (!currentSession?.user || !currentSession.accessToken) redirect('/login');
    try {
      await updateCv(currentSession.accessToken, cvId, { parsedData: { summary: newTitle } });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) redirect('/api/auth/logout');
    }
    revalidatePath('/', 'layout');
  }

  let cvs: Awaited<ReturnType<typeof getMyCvs>>;
  try {
    cvs = await getMyCvs(session.accessToken);
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 401) redirect('/api/auth/logout');
      redirect(buildErrorRedirectPath('/dashboard/candidate/cvs', error, 'load-failed'));
    }
    redirect('/dashboard/candidate/cvs?error=load-failed');
  }

  const routeError = resolveRouteError(query, {
    'missing-file': 'Vui lòng chọn file trước khi tải lên.',
    'CV_FILE_TOO_LARGE': 'File CV quá lớn. Kích thước tối đa là 5MB.',
    'DOCUMENT_UNSUPPORTED_TYPE': 'Chỉ hỗ trợ file PDF và DOCX.',
    'CV_PARSE_FAILED': 'Phân tích AI thất bại cho CV này. Tải lên file PDF hoặc DOCX có thể đọc được và thử lại.',
    'AI_SERVICE_UNAVAILABLE': 'Dịch vụ AI tạm thời không khả dụng. Vui lòng thử tải lên lại sau.',
    'set-primary-failed': 'Đặt CV này làm chính thất bại. Vui lòng thử lại.',
    'delete-failed': 'Xóa CV này thất bại. Vui lòng thử lại.',
    'update-failed': 'Lưu thay đổi CV thất bại. Vui lòng thử lại.',
    'upload-failed': 'Tải lên thất bại. Vui lòng thử lại.',
    'load-failed': 'Không thể tải danh sách CV. Vui lòng thử lại.',
  });

  const userName = session.user.name?.trim() || session.user.email?.split('@')[0] || 'User';

  return (
    <DashboardShell
      title=""
      description=""
      email={session.user.email}
      userName={session.user.name}
      userAvatarUrl={session.user.image}
      role="CANDIDATE"
      currentPath="/dashboard/candidate/cvs"
      breadcrumbs={[
        { label: 'Bảng điều khiển', href: '/dashboard/candidate' },
        { label: 'CV' },
      ]}
      actions={
        returnTo ? (
          <Button asChild variant="outline" size="sm">
            <Link href={returnTo}>Quay lại việc làm</Link>
          </Button>
        ) : undefined
      }
    >
      {routeError ? (
        <Alert className="mb-4" requestId={routeError.requestId}>{routeError.message}</Alert>
      ) : null}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main Content - 2/3 width */}
        <div className="lg:col-span-2">
          <CvPageContent
            items={cvs.items}
            userName={userName}
            onDelete={deleteAction}
            onSetDefault={setPrimaryAction}
            onRename={renameAction}
            accessToken={session.accessToken}
          />
        </div>

        {/* Right Sidebar - 1/3 width */}
        <CvSidebarWidgets userName={userName} hasCvs={cvs.items.length > 0} />
      </div>

      <SiteFooter />
    </DashboardShell>
  );
}

