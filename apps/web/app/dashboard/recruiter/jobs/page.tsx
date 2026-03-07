import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { JdUploadForm } from '@/components/jobs/jd-upload-form';
import { RecruiterJobForm } from '@/components/jobs/recruiter-job-form';
import { RecruiterJobsTable } from '@/components/jobs/recruiter-jobs-table';
import { ApiError } from '@/lib/api-client';
import { composeJobDescription, parseMultilineList } from '@/lib/job-description-format';
import { closeJob, createJob, deleteJob, getJobs, publishJob, uploadJobFile } from '@/lib/jobs-client';

type PageProps = {
  searchParams: Promise<{ error?: string }>;
};

function parseSkills(input: FormDataEntryValue | null): string[] {
  return String(input ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseOptionalNumber(input: FormDataEntryValue | null): number | undefined {
  const value = String(input ?? '').trim();
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export default async function RecruiterJobsPage({ searchParams }: PageProps) {
  const query = await searchParams;
  const session = await auth();
  if (!session?.user || !session.accessToken) {
    redirect('/login');
  }
  if (session.user.role !== 'RECRUITER') {
    redirect('/dashboard');
  }

  async function createAction(formData: FormData) {
    'use server';
    const currentSession = await auth();
    if (!currentSession?.user || !currentSession.accessToken) redirect('/login');
    if (currentSession.user.role !== 'RECRUITER') redirect('/dashboard');

    const summary = String(formData.get('summary') ?? '').trim();
    const requirements = parseMultilineList(
      String(formData.get('requirements') ?? ''),
    );
    const benefits = parseMultilineList(String(formData.get('benefits') ?? ''));

    try {
      await createJob(currentSession.accessToken, {
        title: String(formData.get('title') ?? '').trim(),
        description: composeJobDescription({
          summary,
          requirements,
          benefits,
        }),
        skills: parseSkills(formData.get('skills')),
        employmentType: String(formData.get('employmentType') ?? '').trim(),
        salaryMin: parseOptionalNumber(formData.get('salaryMin')),
        salaryMax: parseOptionalNumber(formData.get('salaryMax')),
      });
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401) {
          redirect('/login');
        }
        if (error.status === 422) {
          redirect('/dashboard/recruiter/jobs?error=parse-failed');
        }
        if (error.status === 503) {
          redirect('/dashboard/recruiter/jobs?error=service-unavailable');
        }
      }
      redirect('/dashboard/recruiter/jobs?error=create-failed');
    }
    revalidatePath('/dashboard/recruiter/jobs');
  }

  async function uploadAction(formData: FormData) {
    'use server';
    const currentSession = await auth();
    if (!currentSession?.user || !currentSession.accessToken) redirect('/login');
    if (currentSession.user.role !== 'RECRUITER') redirect('/dashboard');

    try {
      const created = await uploadJobFile(currentSession.accessToken, formData);
      revalidatePath('/dashboard/recruiter/jobs');
      redirect(`/dashboard/recruiter/jobs/${created.id}`);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401) {
          redirect('/login');
        }
        if (error.status === 413) {
          redirect('/dashboard/recruiter/jobs?error=file-too-large');
        }
        if (error.status === 415) {
          redirect('/dashboard/recruiter/jobs?error=unsupported-file');
        }
        if (error.status === 422) {
          redirect('/dashboard/recruiter/jobs?error=parse-failed');
        }
        if (error.status === 503) {
          redirect('/dashboard/recruiter/jobs?error=service-unavailable');
        }
      }
      redirect('/dashboard/recruiter/jobs?error=upload-failed');
    }
  }

  async function publishAction(formData: FormData) {
    'use server';
    const currentSession = await auth();
    if (!currentSession?.user || !currentSession.accessToken) redirect('/login');
    const jobId = String(formData.get('jobId') ?? '').trim();
    if (!jobId) return;
    await publishJob(currentSession.accessToken, jobId);
    revalidatePath('/dashboard/recruiter/jobs');
  }

  async function closeAction(formData: FormData) {
    'use server';
    const currentSession = await auth();
    if (!currentSession?.user || !currentSession.accessToken) redirect('/login');
    const jobId = String(formData.get('jobId') ?? '').trim();
    if (!jobId) return;
    await closeJob(currentSession.accessToken, jobId);
    revalidatePath('/dashboard/recruiter/jobs');
  }

  async function deleteAction(formData: FormData) {
    'use server';
    const currentSession = await auth();
    if (!currentSession?.user || !currentSession.accessToken) redirect('/login');
    const jobId = String(formData.get('jobId') ?? '').trim();
    if (!jobId) return;
    await deleteJob(currentSession.accessToken, jobId);
    revalidatePath('/dashboard/recruiter/jobs');
  }

  const jobs = await getJobs({ page: 1, limit: 30 }, session.accessToken);
  const draftCount = jobs.items.filter((job) => job.status === 'DRAFT').length;
  const reviewCount = jobs.items.filter(
    (job) => job.parseStatus !== 'parsed_ok',
  ).length;
  const visibleCount = jobs.items.length;
  const totalCount = jobs.pagination.totalItems;
  const errorMessage =
    query.error === 'file-too-large'
      ? 'JD file is too large. Maximum size is 5MB.'
      : query.error === 'unsupported-file'
        ? 'Only PDF and DOCX files are supported for JD upload.'
        : query.error === 'parse-failed'
          ? 'AI parsing failed for this job. Upload a readable JD or try manual creation.'
          : query.error === 'service-unavailable'
            ? 'AI service is temporarily unavailable. Please try the job action again later.'
          : query.error === 'create-failed'
            ? 'Job creation failed. Please try again.'
            : query.error === 'upload-failed'
              ? 'JD upload failed. Please try again.'
              : null;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-12">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-zinc-500">Recruiter</p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900">Job Management</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-600">
            Create jobs manually or upload a JD file, then review draft quality and publish when the role is ready.
          </p>
        </div>
        <Link href="/dashboard/recruiter" className="text-sm font-medium text-zinc-700 underline">
          Back dashboard
        </Link>
      </header>

      {errorMessage ? (
        <p className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}

      <section className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">Total jobs</p>
          <p className="mt-3 text-3xl font-semibold text-zinc-950">{totalCount}</p>
          <p className="mt-2 text-sm text-zinc-600">All drafts, published jobs, and closed roles in your workspace.</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">Visible drafts</p>
          <p className="mt-3 text-3xl font-semibold text-amber-950">{draftCount}</p>
          <p className="mt-2 text-sm text-amber-900/80">Draft jobs in the current list view that still need review or publishing.</p>
        </div>
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-700">Visible attention</p>
          <p className="mt-3 text-3xl font-semibold text-blue-950">{reviewCount}</p>
          <p className="mt-2 text-sm text-blue-900/80">Jobs in the current list view where AI parsing still needs manual verification.</p>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_24rem] xl:items-start">
        <RecruiterJobsTable
          jobs={jobs.items}
          totalItems={totalCount}
          visibleItems={visibleCount}
          publishAction={publishAction}
          closeAction={closeAction}
          deleteAction={deleteAction}
        />
        <div className="space-y-6 xl:sticky xl:top-6">
          <JdUploadForm uploadAction={uploadAction} />
          <RecruiterJobForm submitLabel="Create job" action={createAction} />
        </div>
      </div>
    </main>
  );
}
