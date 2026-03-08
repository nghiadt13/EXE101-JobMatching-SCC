import Link from 'next/link';
import { JobItem } from '@/lib/jobs-client';
import { RecruiterJobStatusActions } from './recruiter-job-status-actions';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';

type RecruiterJobsTableProps = {
  jobs: JobItem[];
  totalItems: number;
  visibleItems: number;
  publishAction: (formData: FormData) => Promise<void>;
  closeAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
};

export function RecruiterJobsTable({
  jobs, totalItems, visibleItems, publishAction, closeAction, deleteAction,
}: RecruiterJobsTableProps) {
  const lifecycleVariant: Record<JobItem['status'], 'primary' | 'success' | 'default'> = {
    DRAFT: 'primary',
    PUBLISHED: 'success',
    CLOSED: 'default',
    ARCHIVED: 'default',
  };

  const parseVariant: Record<JobItem['parseStatus'], 'success' | 'default'> = {
    parsed_ok: 'success',
    needs_review: 'default',
  };

  const parseLabel: Record<JobItem['parseStatus'], string> = {
    parsed_ok: 'Parsed OK',
    needs_review: 'Needs Review',
  };

  if (!jobs.length) {
    return (
      <EmptyState
        title="No jobs yet"
        description="Start with a JD upload or create a draft manually. Uploaded JDs will create structured drafts automatically."
      />
    );
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-zinc-200 px-6 py-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">Your job list</p>
          <h2 className="mt-2 text-xl font-semibold text-zinc-950">Active recruiter workspace</h2>
        </div>
        <div className="text-sm text-zinc-500">
          {visibleItems < totalItems ? `Showing ${visibleItems} of ${totalItems} jobs` : `${totalItems} jobs`}
        </div>
      </div>

      <div className="divide-y divide-zinc-200">
        {jobs.map((job) => {
          const salaryLabel = formatSalary(job.salaryMin, job.salaryMax);
          const summary = getSummaryPreview(job);
          const tags = job.skills.slice(0, 3);
          const extraTagCount = Math.max(0, job.skills.length - tags.length);

          return (
            <article
              key={job.id}
              className="flex flex-col gap-5 px-6 py-6 transition-colors hover:bg-zinc-50/80 xl:flex-row xl:items-start xl:justify-between"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/dashboard/recruiter/jobs/${job.id}`}
                      className="text-lg font-semibold text-zinc-950 underline-offset-4 hover:underline"
                    >
                      {job.title}
                    </Link>
                    <p className="mt-2 line-clamp-2 max-w-3xl text-sm leading-6 text-zinc-600">
                      {summary || 'No summary available yet.'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 xl:justify-end">
                    <Badge variant={lifecycleVariant[job.status]}>{job.status}</Badge>
                    <Badge variant={parseVariant[job.parseStatus]}>{parseLabel[job.parseStatus]}</Badge>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-zinc-500">
                  <span>{formatEmploymentType(job.employmentType)}</span>
                  {salaryLabel ? <span>{salaryLabel}</span> : null}
                  <span>{job.inputMode === 'file_upload' ? 'Uploaded JD' : 'Manual'}</span>
                  <span>Updated {formatDate(job.updatedAt)}</span>
                </div>

                {tags.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {tags.map((skill) => (
                      <Badge key={`${job.id}-skill-${skill}`} variant="outline">{skill}</Badge>
                    ))}
                    {extraTagCount > 0 ? (
                      <Badge variant="outline">+{extraTagCount} more</Badge>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div className="w-full xl:w-52 xl:shrink-0">
                <RecruiterJobStatusActions
                  job={job}
                  publishAction={publishAction}
                  closeAction={closeAction}
                  deleteAction={deleteAction}
                />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function formatEmploymentType(value: string): string {
  return value.split('_').map((item) => item.charAt(0) + item.slice(1).toLowerCase()).join(' ');
}

function formatSalary(min: number | null, max: number | null): string | null {
  if (min === null && max === null) return null;
  const formatter = new Intl.NumberFormat('en-US');
  if (min !== null && max !== null) return `${formatter.format(min)} – ${formatter.format(max)}`;
  if (min !== null) return `From ${formatter.format(min)}`;
  return `Up to ${formatter.format(max ?? 0)}`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
}

function getSummaryPreview(job: JobItem): string {
  const savedDescription = stripDescriptionHeadings(job.description);
  if (savedDescription) return savedDescription;
  return job.normalizedProfile?.summary.trim() || '';
}

function stripDescriptionHeadings(value: string): string {
  return value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
    .filter((line) => !/^(summary|requirements|benefits)\s*:?$/i.test(line)).join(' ');
}
