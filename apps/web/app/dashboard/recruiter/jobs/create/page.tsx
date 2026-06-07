import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { DashboardShell } from '@/components/auth/dashboard-shell';
import { RecruiterJobForm } from '@/components/jobs/recruiter-job-form';
import { Alert } from '@/components/ui/alert';
import { ApiError } from '@/lib/api-client';
import { buildErrorRedirectPath, resolveRouteError } from '@/lib/errors/backend-error-state';
import { composeJobDescription, parseMultilineList } from '@/lib/job-description-format';
import { createJob } from '@/lib/jobs-client';

type PageProps = {
  searchParams: Promise<{ error?: string; message?: string; requestId?: string }>;
};

function parseSkills(input: FormDataEntryValue | null): string[] {
  return String(input ?? '').split(',').map((item) => item.trim()).filter(Boolean);
}

function parseOptionalNumber(input: FormDataEntryValue | null): number | undefined {
  const value = String(input ?? '').trim();
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export default async function CreateJobPage({ searchParams }: PageProps) {
  const query = await searchParams;
  const session = await auth();
  if (!session?.user || !session.accessToken) redirect('/login');
  if (session.user.role !== 'RECRUITER') redirect('/dashboard');

  async function createAction(formData: FormData) {
    'use server';
    const currentSession = await auth();
    if (!currentSession?.user || !currentSession.accessToken) redirect('/login');
    if (currentSession.user.role !== 'RECRUITER') redirect('/dashboard');

    const summary = String(formData.get('summary') ?? '').trim();
    const requirements = parseMultilineList(String(formData.get('requirements') ?? ''));
    const benefits = parseMultilineList(String(formData.get('benefits') ?? ''));

    let createdId: string;
    try {
      const created = await createJob(currentSession.accessToken, {
        title: String(formData.get('title') ?? '').trim(),
        description: composeJobDescription({ summary, requirements, benefits }),
        skills: parseSkills(formData.get('skills')),
        certifications: parseSkills(formData.get('certifications')),
        employmentType: String(formData.get('employmentType') ?? '').trim(),
        salaryMin: parseOptionalNumber(formData.get('salaryMin')),
        salaryMax: parseOptionalNumber(formData.get('salaryMax')),
      });
      createdId = created.id;
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401) redirect('/login');
        redirect(buildErrorRedirectPath('/dashboard/recruiter/jobs/create', error, 'create-failed'));
      }
      redirect('/dashboard/recruiter/jobs/create?error=create-failed');
    }
    
    revalidatePath('/', 'layout');
    redirect(`/dashboard/recruiter/jobs/${createdId}`);
  }

  const routeError = resolveRouteError(query, {
    'create-failed': 'Tạo việc làm thất bại. Vui lòng thử lại.',
  });

  return (
    <DashboardShell
      title="Tạo việc làm thủ công"
      email={session.user.email}
      userName={session.user.name}
      userAvatarUrl={session.user.image}
      role="RECRUITER"
      currentPath="/dashboard/recruiter/jobs/create"
      breadcrumbs={[
        { label: 'Bảng điều khiển', href: '/dashboard/recruiter' },
        { label: 'Việc làm', href: '/dashboard/recruiter/jobs' },
        { label: 'Tạo thủ công' },
      ]}
    >
      {routeError ? (
        <Alert className="mb-6" requestId={routeError.requestId}>{routeError.message}</Alert>
      ) : null}

      <div className="max-w-4xl">
        <RecruiterJobForm submitLabel="Tạo việc làm" action={createAction} />
      </div>
    </DashboardShell>
  );
}
