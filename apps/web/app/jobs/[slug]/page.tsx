import Link from 'next/link';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import { CandidateApplyForm } from '@/components/applications/candidate-apply-form';
import { createApplication } from '@/lib/applications-client';
import { ApiError } from '@/lib/api-client';
import { getMyCvs } from '@/lib/cv-client';
import { getJobDetail } from '@/lib/jobs-client';

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ applied?: string; error?: string }>;
};

export default async function JobDetailPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const session = await auth();

  let job;
  try {
    job = await getJobDetail(slug);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  const canApply =
    session?.user?.role === 'CANDIDATE' && Boolean(session.accessToken);
  const cvs = canApply ? await getMyCvs(session.accessToken as string) : null;

  async function applyAction(formData: FormData) {
    'use server';
    const currentSession = await auth();
    if (!currentSession?.user || !currentSession.accessToken) {
      redirect(`/login?callbackUrl=${encodeURIComponent(`/jobs/${slug}`)}`);
    }
    if (currentSession.user.role !== 'CANDIDATE') {
      redirect('/dashboard');
    }
    const cvId = String(formData.get('cvId') ?? '').trim();
    const jobId = String(formData.get('jobId') ?? '').trim();
    if (!cvId || !jobId) {
      redirect(`/jobs/${slug}?error=missing`);
    }
    try {
      await createApplication(currentSession.accessToken, { cvId, jobId });
      redirect(`/jobs/${slug}?applied=1`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        redirect(`/jobs/${slug}?error=duplicate`);
      }
      redirect(`/jobs/${slug}?error=failed`);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-6 py-12">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-zinc-500">Job</p>
          <h1 className="mt-1 text-3xl font-semibold text-zinc-900">{job.title}</h1>
          <p className="mt-2 text-sm text-zinc-500">{job.employmentType}</p>
        </div>
        <Link href="/jobs" className="text-sm font-medium text-zinc-700 underline">
          Back jobs
        </Link>
      </header>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="whitespace-pre-wrap text-zinc-800">{job.description}</p>
        {!!job.skills.length && (
          <div className="mt-4 flex flex-wrap gap-2">
            {job.skills.map((skill) => (
              <span key={skill} className="rounded-full bg-zinc-100 px-2 py-1 text-xs text-zinc-700">
                {skill}
              </span>
            ))}
          </div>
        )}

        {query.applied === '1' && (
          <p className="mt-4 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            Application submitted successfully.
          </p>
        )}
        {query.error && (
          <p className="mt-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
            {query.error === 'duplicate'
              ? 'You already applied to this job.'
              : 'Unable to submit application.'}
          </p>
        )}

        {canApply && cvs && cvs.items.length > 0 ? (
          <CandidateApplyForm jobId={job.id} cvs={cvs.items} action={applyAction} />
        ) : null}
        {canApply && cvs && cvs.items.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-600">
            Please upload a CV first in your dashboard before applying.
          </p>
        ) : null}
        {!session?.user && (
          <p className="mt-4 text-sm text-zinc-600">
            <Link href={`/login?callbackUrl=${encodeURIComponent(`/jobs/${slug}`)}`} className="underline">
              Sign in
            </Link>{' '}
            as candidate to apply.
          </p>
        )}
      </section>
    </main>
  );
}
