import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { RecruiterJobForm } from '@/components/jobs/recruiter-job-form';
import { getJobDetail, updateJob } from '@/lib/jobs-client';

type PageProps = {
  params: Promise<{ id: string }>;
};

function parseSkills(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseOptionalNumber(value: string): number | undefined {
  const normalized = value.trim();
  if (!normalized) return undefined;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export default async function RecruiterJobDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user || !session.accessToken) {
    redirect('/login');
  }
  if (session.user.role !== 'RECRUITER') {
    redirect('/dashboard');
  }

  const { id } = await params;
  const job = await getJobDetail(id, session.accessToken);

  async function updateAction(formData: FormData) {
    'use server';
    const currentSession = await auth();
    if (!currentSession?.user || !currentSession.accessToken) {
      redirect('/login');
    }

    await updateJob(currentSession.accessToken, id, {
      title: String(formData.get('title') ?? '').trim(),
      description: String(formData.get('description') ?? '').trim(),
      skills: parseSkills(String(formData.get('skills') ?? '')),
      employmentType: String(formData.get('employmentType') ?? '').trim(),
      salaryMin: parseOptionalNumber(String(formData.get('salaryMin') ?? '')),
      salaryMax: parseOptionalNumber(String(formData.get('salaryMax') ?? '')),
    });
    revalidatePath(`/dashboard/recruiter/jobs/${id}`);
    revalidatePath('/dashboard/recruiter/jobs');
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-6 py-12">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-zinc-500">Recruiter Job</p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900">Edit Job</h1>
        </div>
        <Link href="/dashboard/recruiter/jobs" className="text-sm font-medium text-zinc-700 underline">
          Back jobs
        </Link>
      </header>

      <RecruiterJobForm
        submitLabel="Save changes"
        action={updateAction}
        initialValues={{
          title: job.title,
          description: job.description,
          skills: job.skills,
          employmentType: job.employmentType,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
        }}
      />
    </main>
  );
}
