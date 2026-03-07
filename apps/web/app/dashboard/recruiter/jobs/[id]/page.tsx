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

function getParseMessage(
  parseStatus: string,
  inputMode: 'manual' | 'file_upload',
) {
  if (inputMode === 'manual') {
    return 'This job was normalized from the current form fields. Review the parsed summary, skills, and requirements before publishing.';
  }
  if (parseStatus === 'parsed_ok') {
    return 'The uploaded JD was parsed successfully. Review the draft fields before publishing.';
  }
  if (parseStatus === 'fallback') {
    return 'Auto-normalization fell back to a degraded parse. Check title, description, skills, and requirements before publishing.';
  }
  return 'This draft needs manual review before publish. Verify the parsed summary, skills, and requirements.';
}

function getParseTone(parseStatus: string) {
  if (parseStatus === 'parsed_ok') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  }
  if (parseStatus === 'fallback') {
    return 'border-amber-200 bg-amber-50 text-amber-800';
  }
  return 'border-zinc-300 bg-zinc-100 text-zinc-800';
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
      <section className={`mt-6 rounded-2xl border px-4 py-3 text-sm ${getParseTone(job.parseStatus)}`}>
        <p className="font-semibold uppercase tracking-[0.08em]">Parse status: {job.parseStatus}</p>
        <p className="mt-2">{getParseMessage(job.parseStatus, job.inputMode)}</p>
        {job.parseTelemetry ? (
          <p className="mt-2 text-xs opacity-80">
            Source: {job.parseTelemetry.source} · Fallback used: {job.parseTelemetry.fallbackUsed ? 'yes' : 'no'}
          </p>
        ) : null}
      </section>
      <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-zinc-600">
          AI Parsed Preview
        </h2>
        <p className="mt-2 text-xs text-zinc-500">Status: {job.parseStatus}</p>
        <p className="mt-3 text-sm text-zinc-700">
          {job.normalizedProfile?.summary || 'No parsed summary available yet.'}
        </p>
        {job.normalizedProfile?.skills?.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {job.normalizedProfile.skills.slice(0, 12).map((skill) => (
              <span key={`${job.id}-${skill}`} className="rounded-full bg-zinc-100 px-2 py-1 text-xs text-zinc-700">
                {skill}
              </span>
            ))}
          </div>
        ) : null}
        {job.normalizedProfile?.jobMeta?.requirements?.length ? (
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">Requirements</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-700">
              {job.normalizedProfile.jobMeta.requirements.slice(0, 8).map((item) => (
                <li key={`${job.id}-req-${item}`}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {job.normalizedProfile?.jobMeta?.benefits?.length ? (
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">Benefits</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-700">
              {job.normalizedProfile.jobMeta.benefits.slice(0, 8).map((item) => (
                <li key={`${job.id}-benefit-${item}`}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>
    </main>
  );
}
