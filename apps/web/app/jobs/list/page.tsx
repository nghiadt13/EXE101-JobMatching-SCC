import { getJobs } from '@/lib/jobs-client';
import { JobListClient } from '@/components/jobs/job-list-client';
import { SiteHeader } from '@/components/layout/site-header';
import { parseJobsQueryFromSearchParams } from '@/lib/jobs-query';
import { auth } from '@/auth';

export const metadata = {
  title: 'Việc làm - SCC',
  description: 'Tìm kiếm và ứng tuyển việc làm phù hợp nhất với bạn.',
};

export default async function JobListPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedParams = await searchParams;
  const session = await auth();
  const isAuthenticated = Boolean(session?.user);
  const query = parseJobsQueryFromSearchParams(resolvedParams);

  let initialResult: Awaited<ReturnType<typeof getJobs>> | null = null;
  try {
    initialResult = await getJobs({
      ...query,
      status: 'PUBLISHED',
      includeFacets: true,
    });
  } catch {
    // API may not be running
  }

  return (
    <div className="min-h-screen bg-background-light text-slate-900">
      <SiteHeader
        isAuthenticated={Boolean(session?.accessToken)}
        role={session?.user?.role}
        user={session?.user ? {
          name: session.user.name,
          email: session.user.email,
          avatarUrl: session.user.image,
        } : null}
      />
      <JobListClient
        initialQuery={query}
        initialJobs={initialResult?.items ?? []}
        initialTotal={initialResult?.pagination.totalItems ?? 0}
        initialPage={initialResult?.pagination.page ?? 1}
        initialTotalPages={initialResult?.pagination.totalPages ?? 1}
        initialFacets={initialResult?.facets ?? null}
        isAuthenticated={isAuthenticated}
        user={session?.user ? { name: session.user.name, avatarUrl: session.user.image } : null}
      />
    </div>
  );
}
