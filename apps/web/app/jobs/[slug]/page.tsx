import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { auth } from '@/auth';
import { DashboardShell } from '@/components/auth/dashboard-shell';
import { CandidateApplyForm } from '@/components/applications/candidate-apply-form';
import { ExpandableChips } from '@/components/cv/expandable-chips';
import { PageHeader } from '@/components/ui/page-header';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { createApplication } from '@/lib/applications-client';
import { ApiError } from '@/lib/api-client';
import { getMyCvs } from '@/lib/cv-client';
import { getJobDetail } from '@/lib/jobs-client';
import { safeJsonLdSerialize } from '@/lib/seo';

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ applied?: string; error?: string }>;
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const job = await getJobDetail(slug);
    const isPublic = job.status === 'PUBLISHED';
    return {
      title: `${job.title} | Jobs`,
      description: job.description.slice(0, 140),
      alternates: { canonical: `/jobs/${job.slug}` },
      robots: isPublic ? { index: true, follow: true } : { index: false, follow: true },
    };
  } catch {
    return {
      title: 'Job details',
      robots: { index: false, follow: false },
    };
  }
}

export default async function JobDetailPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const session = await auth();

  let job;
  try {
    job = await getJobDetail(slug);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const canApply = session?.user?.role === 'CANDIDATE' && Boolean(session.accessToken);
  const cvs = canApply ? await getMyCvs(session.accessToken as string) : null;
  const errorMessage =
    query.error === 'duplicate' ? 'You already applied to this job.'
    : query.error === 'missing' ? 'Please select a CV before submitting your application.'
    : query.error ? 'Unable to submit application.'
    : null;

  async function applyAction(formData: FormData) {
    'use server';
    const currentSession = await auth();
    if (!currentSession?.user || !currentSession.accessToken) redirect(`/login?callbackUrl=${encodeURIComponent(`/jobs/${slug}`)}`);
    if (currentSession.user.role !== 'CANDIDATE') redirect('/dashboard');
    const cvId = String(formData.get('cvId') ?? '').trim();
    const jobId = String(formData.get('jobId') ?? '').trim();
    if (!cvId || !jobId) redirect(`/jobs/${slug}?error=missing`);
    let redirectTarget = `/jobs/${slug}?applied=1`;
    try {
      await createApplication(currentSession.accessToken, { cvId, jobId });
    } catch (error) {
      redirectTarget = error instanceof ApiError && error.status === 409
        ? `/jobs/${slug}?error=duplicate`
        : `/jobs/${slug}?error=failed`;
    }
    redirect(redirectTarget);
  }

  const jobPath = `/jobs/${slug}`;
  const cvPrereqUrl = `/dashboard/candidate/cvs?returnTo=${encodeURIComponent(jobPath)}`;
  const isPublicJob = job.status === 'PUBLISHED';
  const jobPostingJsonLd = isPublicJob
    ? {
        '@context': 'https://schema.org',
        '@type': 'JobPosting',
        title: job.title,
        description: job.description,
        employmentType: job.employmentType,
        datePosted: job.publishedAt ?? job.createdAt,
        url: `${process.env.NEXT_PUBLIC_WEB_URL ?? 'http://localhost:3000'}/jobs/${job.slug}`,
      }
    : null;

  const jobContent = (
    <>
      {jobPostingJsonLd ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLdSerialize(jobPostingJsonLd) }} />
      ) : null}
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="whitespace-pre-wrap text-zinc-800">{job.description}</p>
        {!!job.skills.length && (
          <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <ExpandableChips title="Key skills" items={job.skills} />
          </div>
        )}

        {query.applied === '1' && (
          <Alert variant="success" className="mt-4" role="status" aria-live="polite">
            Application submitted successfully.
          </Alert>
        )}
        {errorMessage && (
          <Alert className="mt-4" role="alert" aria-live="assertive">
            {errorMessage}
          </Alert>
        )}

        {canApply && cvs && cvs.items.length > 0 ? (
          <CandidateApplyForm jobId={job.id} cvs={cvs.items} action={applyAction} />
        ) : null}
        {canApply && cvs && cvs.items.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-600">
            Please{' '}
            <Link href={cvPrereqUrl} className="font-medium underline">upload a CV</Link>
            {' '}first before applying.
          </p>
        ) : null}
        {!session?.user && (
          <p className="mt-4 text-sm text-zinc-600">
            <Link href={`/login?callbackUrl=${encodeURIComponent(jobPath)}`} className="font-medium underline">Sign in</Link>{' '}
            as candidate to apply.
          </p>
        )}
        {session?.user && session.user.role !== 'CANDIDATE' && (
          <p className="mt-4 text-sm text-zinc-600">Only candidate accounts can apply for jobs.</p>
        )}
      </section>
    </>
  );

  if (canApply || (session?.user?.role === 'CANDIDATE')) {
    return (
      <DashboardShell
        title={job.title}
        description={job.employmentType}
        email={session?.user?.email}
        role="CANDIDATE"
        currentPath={jobPath}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/jobs">← Back to jobs</Link>
          </Button>
        }
      >
        {jobContent}
      </DashboardShell>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-6 py-12">
      <PageHeader
        overline="Job"
        title={job.title}
        description={job.employmentType}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/jobs">← Back to jobs</Link>
          </Button>
        }
      />
      {jobContent}
    </main>
  );
}
