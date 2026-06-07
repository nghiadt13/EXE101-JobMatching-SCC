import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { DashboardShell } from '@/components/auth/dashboard-shell';
import { RecruiterJobForm } from '@/components/jobs/recruiter-job-form';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ApiError } from '@/lib/api-client';
import { buildErrorRedirectPath, resolveRouteError } from '@/lib/errors/backend-error-state';
import { composeJobDescription, getJobFormInitialValues, parseMultilineList } from '@/lib/job-description-format';
import { getJobDetail, updateJob } from '@/lib/jobs-client';

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; message?: string; requestId?: string }>;
};

function parseSkills(value: string): string[] {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function parseOptionalNumber(value: string): number | undefined {
  const normalized = value.trim();
  if (!normalized) return undefined;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function getParseMessage(parseStatus: string, inputMode: 'manual' | 'file_upload') {
  if (inputMode === 'manual') return 'Việc làm này được chuẩn hóa từ các trường form hiện tại. Duyệt trước khi đăng tuyển.';
  if (parseStatus === 'parsed_ok') return 'JD tải lên đã được phân tích thành công. Duyệt các trường bản nháp trước khi đăng tuyển.';
  return 'Bản nháp này cần duyệt thủ công trước khi đăng tuyển. Xác minh kỹ các trường.';
}



export default async function RecruiterJobDetailPage({ params, searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user || !session.accessToken) redirect('/login');
  if (session.user.role !== 'RECRUITER') redirect('/dashboard');

  const { id } = await params;
  const query = await searchParams;
  const job = await getJobDetail(id, session.accessToken);
  const initialValues = getJobFormInitialValues(job);

  async function updateAction(formData: FormData) {
    'use server';
    const currentSession = await auth();
    if (!currentSession?.user || !currentSession.accessToken) redirect('/login');

    const summary = String(formData.get('summary') ?? '').trim();
    const requirements = parseMultilineList(String(formData.get('requirements') ?? ''));
    const benefits = parseMultilineList(String(formData.get('benefits') ?? ''));

    try {
      await updateJob(currentSession.accessToken, id, {
        title: String(formData.get('title') ?? '').trim(),
        description: composeJobDescription({ summary, requirements, benefits }),
        skills: parseSkills(String(formData.get('skills') ?? '')),
        certifications: parseSkills(String(formData.get('certifications') ?? '')),
        employmentType: String(formData.get('employmentType') ?? '').trim(),
        salaryMin: parseOptionalNumber(String(formData.get('salaryMin') ?? '')),
        salaryMax: parseOptionalNumber(String(formData.get('salaryMax') ?? '')),
      });
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401) redirect('/login');
        redirect(buildErrorRedirectPath(`/dashboard/recruiter/jobs/${id}`, error, 'save-failed'));
      }
      redirect(`/dashboard/recruiter/jobs/${id}?error=save-failed`);
    }
    revalidatePath('/', 'layout');
  }

  const routeError = resolveRouteError(query, {
    'JD_PARSE_FAILED': 'Phân tích AI thất bại khi lưu việc làm này. Duyệt các trường và thử lại.',
    'AI_SERVICE_UNAVAILABLE': 'Dịch vụ AI tạm thời không khả dụng. Vui lòng thử lưu lại sau.',
    'save-failed': 'Lưu việc làm này thất bại. Vui lòng thử lại.',
  });

  const parseBadgeVariant = job.parseStatus === 'parsed_ok' ? 'success' as const : 'warning' as const;

  return (
    <DashboardShell
      title="Chỉnh sửa việc làm"
      email={session.user.email}
      userName={session.user.name}
      userAvatarUrl={session.user.image}
      role="RECRUITER"
      currentPath={`/dashboard/recruiter/jobs/${id}`}
      breadcrumbs={[
        { label: 'Bảng điều khiển', href: '/dashboard/recruiter' },
        { label: 'Việc làm', href: '/dashboard/recruiter/jobs' },
        { label: job.title },
      ]}
      actions={<Badge variant={parseBadgeVariant}>{job.parseStatus === 'parsed_ok' ? 'Phân tích OK' : 'Cần duyệt'}</Badge>}
    >
      {routeError ? (
        <Alert className="mb-6" requestId={routeError.requestId}>{routeError.message}</Alert>
      ) : null}

      <RecruiterJobForm submitLabel="Lưu thay đổi" action={updateAction} initialValues={initialValues} />

      <section className={`mt-6 rounded-2xl border px-4 py-3 text-sm ${job.parseStatus === 'parsed_ok' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-zinc-300 bg-zinc-100 text-zinc-800'}`}>
        <p className="font-semibold uppercase tracking-[0.08em]">Trạng thái phân tích: {job.parseStatus}</p>
        <p className="mt-2">{getParseMessage(job.parseStatus, job.inputMode)}</p>
        {job.parseTelemetry ? (
          <p className="mt-2 text-xs opacity-80">Provider: {job.parseTelemetry.provider} · Model: {job.parseTelemetry.model}</p>
        ) : null}
      </section>

    </DashboardShell>
  );
}
