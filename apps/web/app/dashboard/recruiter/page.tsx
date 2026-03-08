import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { DashboardShell } from '@/components/auth/dashboard-shell';
import { DashboardStatCard } from '@/components/dashboard/dashboard-stat-card';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api-client';
import { getDashboardStats, type RecruiterDashboardStats } from '@/lib/dashboard-client';

export default async function RecruiterDashboardPage() {
  const session = await auth();
  if (!session?.user || !session.accessToken) redirect('/login');
  if (session.user.role !== 'RECRUITER') redirect('/dashboard');

  let stats: RecruiterDashboardStats = {
    totalJobs: 0,
    activeJobs: 0,
    totalApplications: 0,
    pendingReview: 0,
  };
  let errorMessage = '';

  try {
    stats = (await getDashboardStats(session.accessToken)) as RecruiterDashboardStats;
  } catch (error) {
    errorMessage = error instanceof ApiError ? error.message : 'Failed to load dashboard stats';
  }

  return (
    <DashboardShell
      title="Recruiter Dashboard"
      description="Manage jobs, review candidates, and track application progress."
      email={session.user.email}
      role="RECRUITER"
      currentPath="/dashboard/recruiter"
    >
      {errorMessage ? <Alert className="mb-4">{errorMessage}</Alert> : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardStatCard label="Total jobs" value={stats.totalJobs} hint="All jobs you created" />
        <DashboardStatCard label="Published jobs" value={stats.activeJobs} hint="Jobs currently visible to candidates" />
        <DashboardStatCard label="Applications" value={stats.totalApplications} hint="Applications received for your jobs" />
        <DashboardStatCard label="Pending review" value={stats.pendingReview} hint="New applications waiting for first action" />
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/dashboard/recruiter/jobs">Manage jobs</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/dashboard/recruiter/applications">Review applications</Link>
        </Button>
      </div>
    </DashboardShell>
  );
}
