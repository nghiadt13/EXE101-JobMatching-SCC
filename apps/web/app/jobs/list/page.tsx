import { getJobs } from '@/lib/jobs-client';
import { JobListClient } from '@/components/jobs/job-list-client';
import { auth } from '@/auth';

export const metadata = {
  title: 'Việc làm - HireStream',
  description:
    'Tìm kiếm và ứng tuyển việc làm phù hợp nhất với bạn. Hàng nghìn vị trí từ các công ty hàng đầu Việt Nam.',
};

export default async function JobListPage() {
  const session = await auth();
  const isAuthenticated = Boolean(session?.user);

  let initialJobs: Awaited<ReturnType<typeof getJobs>> | null = null;
  try {
    initialJobs = await getJobs({
      page: 1,
      limit: 10,
      status: 'PUBLISHED',
    });
  } catch {
    // API may not be running, render with empty state
  }

  return (
    <JobListClient
      initialJobs={initialJobs?.items ?? []}
      initialTotal={initialJobs?.pagination.totalItems ?? 0}
      initialPage={initialJobs?.pagination.page ?? 1}
      initialTotalPages={initialJobs?.pagination.totalPages ?? 1}
      isAuthenticated={isAuthenticated}
      user={
        session?.user
          ? {
              name: session.user.name,
              avatarUrl: session.user.image,
            }
          : null
      }
    />
  );
}
