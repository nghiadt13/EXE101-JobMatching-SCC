import Link from 'next/link';
import { auth } from '@/auth';
import { DashboardShell } from '@/components/auth/dashboard-shell';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { getJobs } from '@/lib/jobs-client';
import { parseJobsQueryFromSearchParams } from '@/lib/jobs-query';
import { PUBLIC_JOBS_LISTING_ROUTE } from '@/lib/routes';
import { JobListingCard } from './job-listing-card';
import { JobsActiveFilters } from './jobs-active-filters';
import { JobsFilterForm } from './jobs-filter-form';
import { JobsPagination } from './jobs-pagination';

type JobsListingPageProps = {
  searchParams: Record<string, string | string[] | undefined>;
  currentPath?: string;
};

function isEnabled(key: string): boolean {
  const value = process.env[key];
  return value === '1' || value === 'true' || value === 'yes';
}

export async function JobsListingPage({
  searchParams,
  currentPath = PUBLIC_JOBS_LISTING_ROUTE,
}: JobsListingPageProps) {
  const jobsFiltersEnabled = isEnabled('WEB_JOBS_FILTERS_V1_ENABLED');
  const session = await auth();
  const role = session?.user?.role ?? null;

  if (!jobsFiltersEnabled) {
    const jobs = await getJobs({ page: 1, limit: 30 });
    const jobsList = (
      <section className="grid gap-4">
        {jobs.items.map((job) => (
          <JobListingCard key={job.id} job={job} />
        ))}
        {!jobs.items.length ? (
          <EmptyState
            title="No published jobs yet"
            description="Please check back later for new opportunities."
          />
        ) : null}
      </section>
    );

    if (role === 'CANDIDATE') {
      return (
        <DashboardShell
          title="Open Positions"
          description="Browse published jobs, open details, then submit your application from the detail page."
          email={session?.user?.email}
          userName={session?.user?.name}
          userAvatarUrl={session?.user?.image}
          role="CANDIDATE"
          currentPath={currentPath}
        >
          {jobsList}
        </DashboardShell>
      );
    }

    const headerAction = role ? (
      <Button asChild variant="outline" size="sm">
        <Link href="/dashboard">Back to dashboard</Link>
      </Button>
    ) : (
      <Button asChild variant="outline" size="sm">
        <Link href="/login">Sign in</Link>
      </Button>
    );

    return (
      <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-12">
        <PageHeader
          overline="Jobs"
          title="Open Positions"
          description="Browse published jobs, open details, then submit your application from the detail page."
          actions={headerAction}
        />
        {jobsList}
      </main>
    );
  }

  const query = parseJobsQueryFromSearchParams(searchParams);
  const jobs = await getJobs({ ...query, includeFacets: true });
  const apiFiltersApplied = Boolean(jobs.meta);

  const headerAction = role ? (
    <Button asChild variant="outline" size="sm">
      <Link href="/dashboard">Back to dashboard</Link>
    </Button>
  ) : (
    <Button asChild variant="outline" size="sm">
      <Link href="/login">Sign in</Link>
    </Button>
  );

  const jobsList = (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-zinc-600">{jobs.pagination.totalItems} jobs found</p>
      </div>

      <JobsFilterForm query={query} />
      {!apiFiltersApplied ? (
        <Alert>
          Jobs filters UI is enabled, but API filters are currently disabled. Results may ignore some filters.
        </Alert>
      ) : null}
      {apiFiltersApplied ? <JobsActiveFilters query={query} /> : null}

      {jobs.items.length > 0 ? (
        <section className="grid gap-4">
          {jobs.items.map((job) => (
            <JobListingCard key={job.id} job={job} />
          ))}
        </section>
      ) : (
        <EmptyState
          title="No jobs match these filters"
          description="Adjust filters or reset to view more opportunities."
        />
      )}

      <JobsPagination page={jobs.pagination.page} totalPages={jobs.pagination.totalPages} query={query} />
    </div>
  );

  if (role === 'CANDIDATE') {
    return (
      <DashboardShell
        title="Open Positions"
        description="Search and filter open jobs, then apply from the job detail page."
        email={session?.user?.email}
          userName={session?.user?.name}
          userAvatarUrl={session?.user?.image}
        role="CANDIDATE"
        currentPath={currentPath}
      >
        {jobsList}
      </DashboardShell>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-12">
      <PageHeader
        overline="Jobs"
        title="Open Positions"
        description="Search, filter, and explore published opportunities."
        actions={headerAction}
      />
      {jobsList}
    </main>
  );
}

