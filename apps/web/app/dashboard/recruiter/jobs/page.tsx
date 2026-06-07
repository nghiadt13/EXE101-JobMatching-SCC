import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { DashboardShell } from '@/components/auth/dashboard-shell';
import Link from 'next/link';
import { JdUploadForm } from '@/components/jobs/jd-upload-form';
import { RecruiterJobsTable } from '@/components/jobs/recruiter-jobs-table';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api-client';
import { buildErrorRedirectPath, resolveRouteError } from '@/lib/errors/backend-error-state';
import { closeJob, deleteJob, getJobs, publishJob, uploadJobFile } from '@/lib/jobs-client';

type PageProps = {
  searchParams: Promise<{ error?: string; message?: string; requestId?: string; page?: string; status?: string; q?: string }>;
};



export default async function RecruiterJobsPage({ searchParams }: PageProps) {
  const query = await searchParams;
  const session = await auth();
  if (!session?.user || !session.accessToken) redirect('/login');
  if (session.user.role !== 'RECRUITER') redirect('/dashboard');



  async function uploadAction(formData: FormData) {
    'use server';
    const currentSession = await auth();
    if (!currentSession?.user || !currentSession.accessToken) redirect('/login');
    if (currentSession.user.role !== 'RECRUITER') redirect('/dashboard');

    let createdId: string;
    try {
      const created = await uploadJobFile(currentSession.accessToken, formData);
      createdId = created.id;
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401) redirect('/login');
        redirect(buildErrorRedirectPath('/dashboard/recruiter/jobs', error, 'upload-failed'));
      }
      redirect('/dashboard/recruiter/jobs?error=upload-failed');
    }
    revalidatePath('/', 'layout');
    redirect(`/dashboard/recruiter/jobs/${createdId}`);
  }

  async function publishAction(formData: FormData) {
    'use server';
    const currentSession = await auth();
    if (!currentSession?.user || !currentSession.accessToken) redirect('/login');
    const jobId = String(formData.get('jobId') ?? '').trim();
    if (!jobId) return;
    await publishJob(currentSession.accessToken, jobId);
    revalidatePath('/', 'layout');
  }

  async function closeAction(formData: FormData) {
    'use server';
    const currentSession = await auth();
    if (!currentSession?.user || !currentSession.accessToken) redirect('/login');
    const jobId = String(formData.get('jobId') ?? '').trim();
    if (!jobId) return;
    await closeJob(currentSession.accessToken, jobId);
    revalidatePath('/', 'layout');
  }

  async function deleteAction(formData: FormData) {
    'use server';
    const currentSession = await auth();
    if (!currentSession?.user || !currentSession.accessToken) redirect('/login');
    const jobId = String(formData.get('jobId') ?? '').trim();
    if (!jobId) return;
    await deleteJob(currentSession.accessToken, jobId);
    revalidatePath('/', 'layout');
  }

  const page = Math.max(1, parseInt(query.page ?? '1', 10) || 1);
  const status = query.status as any;
  const q = query.q || undefined;

  const jobs = await getJobs({ page, limit: 10, status, q }, session.accessToken);
  const visibleCount = jobs.items.length;
  const totalCount = jobs.pagination.totalItems;
  const totalPages = jobs.pagination.totalPages;

  const routeError = resolveRouteError(query, {
    'create-failed': 'Tạo việc làm thất bại. Vui lòng thử lại.',
    'CV_FILE_TOO_LARGE': 'File JD quá lớn. Kích thước tối đa là 5MB.',
    'DOCUMENT_UNSUPPORTED_TYPE': 'Chỉ hỗ trợ file PDF và DOCX cho tải lên JD.',
    'JD_FILE_TOO_LARGE': 'File JD quá lớn. Kích thước tối đa là 5MB.',
    'JD_PARSE_FAILED': 'Phân tích AI thất bại cho việc làm này. Tải lên JD có thể đọc được hoặc thử tạo thủ công.',
    'service-unavailable': 'Dịch vụ AI tạm thời không khả dụng. Vui lòng thử lại sau.',
    'upload-failed': 'Tải lên JD thất bại. Vui lòng thử lại.',
    'AI_SERVICE_UNAVAILABLE': 'Dịch vụ AI tạm thời không khả dụng. Vui lòng thử lại sau.',
  });

  return (
    <DashboardShell
      title="Quản lý việc làm"
      description="Tạo việc làm thủ công hoặc tải lên file JD, sau đó kiểm tra chất lượng bản nháp và đăng tuyển khi sẵn sàng."
      email={session.user.email}
      userName={session.user.name}
      userAvatarUrl={session.user.image}
      role="RECRUITER"
      currentPath="/dashboard/recruiter/jobs"
      breadcrumbs={[
        { label: 'Bảng điều khiển', href: '/dashboard/recruiter' },
        { label: 'Việc làm' },
      ]}
    >
      {routeError ? (
        <Alert className="mb-6" requestId={routeError.requestId}>{routeError.message}</Alert>
      ) : null}

      <section className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
            {status === 'PUBLISHED' ? 'Việc làm đã đăng' : status === 'DRAFT' ? 'Việc làm nháp' : 'Tổng việc làm'}
          </p>
          <p className="mt-3 text-3xl font-semibold text-zinc-950">{totalCount}</p>
          <p className="mt-2 text-sm text-zinc-600">Số lượng việc làm theo bộ lọc hiện tại.</p>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_24rem] xl:items-start">
        <RecruiterJobsTable
          jobs={jobs.items}
          totalItems={totalCount}
          visibleItems={visibleCount}
          currentPage={page}
          totalPages={totalPages}
          currentStatus={status}
          currentSearch={q}
          publishAction={publishAction}
          closeAction={closeAction}
          deleteAction={deleteAction}
        />
        <div className="space-y-6 xl:sticky xl:top-6">
          <JdUploadForm uploadAction={uploadAction} />
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm text-center">
            <h3 className="mb-2 text-sm font-semibold text-zinc-900">Tạo việc làm mới</h3>
            <p className="mb-4 text-xs text-zinc-600">Bạn muốn tự thiết lập các trường thay vì tải lên JD?</p>
            <Button asChild className="w-full">
              <Link href="/dashboard/recruiter/jobs/create">Thêm việc làm thủ công</Link>
            </Button>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

