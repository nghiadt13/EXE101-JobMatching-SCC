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
import { getJobDetail, updateJob, type RequirementsSchema } from '@/lib/jobs-client';

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
  if (inputMode === 'manual') return 'This job was normalized from the current form fields. Review before publishing.';
  if (parseStatus === 'parsed_ok') return 'The uploaded JD was parsed successfully. Review the draft fields before publishing.';
  return 'This draft needs manual review before publish. Verify fields carefully.';
}

function splitRequirementGroups(schema: RequirementsSchema | null) {
  if (!schema) {
    return {
      mustHaves: [] as Array<{ id: string; label: string }>,
      niceToHaves: [] as Array<{ id: string; label: string }>,
      locationPreference: null as RequirementsSchema['locationPreference'],
    };
  }

  if (schema.version === 'requirements_schema_v1') {
    return {
      mustHaves: schema.mustHaves,
      niceToHaves: schema.niceToHaves,
      locationPreference: schema.locationPreference,
    };
  }

  const mustHaves = schema.requirements.filter(
    (item) => item.importance === 'critical' || item.importance === 'high',
  );
  const niceToHaves = schema.requirements.filter(
    (item) =>
      item.importance === 'medium' ||
      item.importance === 'low' ||
      item.importance === 'very_low',
  );
  return {
    mustHaves,
    niceToHaves,
    locationPreference: schema.locationPreference,
  };
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
    revalidatePath(`/dashboard/recruiter/jobs/${id}`);
    revalidatePath('/dashboard/recruiter/jobs');
  }

  const routeError = resolveRouteError(query, {
    'JD_PARSE_FAILED': 'AI parsing failed while saving this job. Review the fields and try again.',
    'AI_SERVICE_UNAVAILABLE': 'AI service is temporarily unavailable. Please try saving again later.',
    'save-failed': 'Saving this job failed. Please try again.',
  });

  const parseBadgeVariant = job.parseStatus === 'parsed_ok' ? 'success' as const : 'warning' as const;
  const requirementGroups = splitRequirementGroups(job.requirementsSchema);

  return (
    <DashboardShell
      title="Edit Job"
      email={session.user.email}
      role="RECRUITER"
      currentPath={`/dashboard/recruiter/jobs/${id}`}
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard/recruiter' },
        { label: 'Jobs', href: '/dashboard/recruiter/jobs' },
        { label: job.title },
      ]}
      actions={<Badge variant={parseBadgeVariant}>{job.parseStatus === 'parsed_ok' ? 'Parsed OK' : 'Needs Review'}</Badge>}
    >
      {routeError ? (
        <Alert className="mb-6" requestId={routeError.requestId}>{routeError.message}</Alert>
      ) : null}

      <RecruiterJobForm submitLabel="Save changes" action={updateAction} initialValues={initialValues} />

      <section className={`mt-6 rounded-2xl border px-4 py-3 text-sm ${job.parseStatus === 'parsed_ok' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-zinc-300 bg-zinc-100 text-zinc-800'}`}>
        <p className="font-semibold uppercase tracking-[0.08em]">Parse status: {job.parseStatus}</p>
        <p className="mt-2">{getParseMessage(job.parseStatus, job.inputMode)}</p>
        {job.parseTelemetry ? (
          <p className="mt-2 text-xs opacity-80">Provider: {job.parseTelemetry.provider} · Model: {job.parseTelemetry.model}</p>
        ) : null}
      </section>

      <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-zinc-600">AI Parsed Preview</h2>
        <p className="mt-3 text-sm text-zinc-700">{job.normalizedProfile?.summary || 'No parsed summary available yet.'}</p>
        {job.normalizedProfile?.skills?.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {job.normalizedProfile.skills.slice(0, 12).map((skill) => (
              <Badge key={`${job.id}-${skill}`} variant="outline">{skill}</Badge>
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
        {job.requirementsSchema ? (
          <div className="mt-5 grid gap-4 border-t border-zinc-200 pt-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">Must Have</p>
              <ul className="mt-2 space-y-1 text-sm text-zinc-700">
                {requirementGroups.mustHaves.slice(0, 8).map((item) => (
                  <li key={item.id}>• {item.label}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">Nice To Have</p>
              <ul className="mt-2 space-y-1 text-sm text-zinc-700">
                {requirementGroups.niceToHaves.slice(0, 8).map((item) => (
                  <li key={item.id}>• {item.label}</li>
                ))}
              </ul>
              {requirementGroups.locationPreference ? (
                <p className="mt-3 text-xs text-zinc-500">
                  Location: {[
                    requirementGroups.locationPreference.city,
                    requirementGroups.locationPreference.country,
                    requirementGroups.locationPreference.remote ? 'Remote' : '',
                  ].filter(Boolean).join(' · ')}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
      </section>
    </DashboardShell>
  );
}
