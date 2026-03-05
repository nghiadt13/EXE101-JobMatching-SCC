import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { RecruiterJobForm } from '@/components/jobs/recruiter-job-form';
import { RecruiterJobsTable } from '@/components/jobs/recruiter-jobs-table';
import { closeJob, createJob, deleteJob, getJobs, publishJob } from '@/lib/jobs-client';

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

export default async function RecruiterJobsPage() {
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

    await createJob(currentSession.accessToken, {
      title: String(formData.get('title') ?? '').trim(),
      description: String(formData.get('description') ?? '').trim(),
      skills: parseSkills(formData.get('skills')),
      employmentType: String(formData.get('employmentType') ?? '').trim(),
      salaryMin: parseOptionalNumber(formData.get('salaryMin')),
      salaryMax: parseOptionalNumber(formData.get('salaryMax')),
    });
    revalidatePath('/dashboard/recruiter/jobs');
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

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-12">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-zinc-500">Recruiter</p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900">Job Management</h1>
        </div>
        <Link href="/dashboard/recruiter" className="text-sm font-medium text-zinc-700 underline">
          Back dashboard
        </Link>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1.9fr]">
        <RecruiterJobForm submitLabel="Create job" action={createAction} />
        <RecruiterJobsTable
          jobs={jobs.items}
          publishAction={publishAction}
          closeAction={closeAction}
          deleteAction={deleteAction}
        />
      </div>
    </main>
  );
}
