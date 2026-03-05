import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { DashboardShell } from '@/components/auth/dashboard-shell';
import { DashboardStatCard } from '@/components/dashboard/dashboard-stat-card';
import { ApiError } from '@/lib/api-client';
import { getDashboardStats, type RecruiterDashboardStats } from '@/lib/dashboard-client';

export default async function RecruiterDashboardPage() {
  const session = await auth();
  if (!session?.user || !session.accessToken) {
    redirect('/login');
  }
  if (session.user.role !== 'RECRUITER') {
    redirect('/dashboard');
  }

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
    if (error instanceof ApiError) {
      errorMessage = error.message;
    } else {
      errorMessage = 'Failed to load dashboard stats';
    }
  }

  return (
    <DashboardShell
      title="Recruiter Dashboard"
      description="Manage jobs, review candidates, and track application progress."
      email={session.user.email}
    >
      {errorMessage ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardStatCard
          label="Total jobs"
          value={stats.totalJobs}
          hint="All jobs you created"
        />
        <DashboardStatCard
          label="Published jobs"
          value={stats.activeJobs}
          hint="Jobs currently visible to candidates"
        />
        <DashboardStatCard
          label="Applications"
          value={stats.totalApplications}
          hint="Applications received for your jobs"
        />
        <DashboardStatCard
          label="Pending review"
          value={stats.pendingReview}
          hint="New applications waiting for first action"
        />
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href="/dashboard/recruiter/jobs"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Manage jobs
        </Link>
        <Link
          href="/dashboard/profile"
          className="inline-flex h-10 items-center justify-center rounded-lg border border-zinc-300 px-4 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
        >
          My profile
        </Link>
        <Link
          href="/dashboard/recruiter/applications"
          className="inline-flex h-10 items-center justify-center rounded-lg border border-zinc-300 px-4 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
        >
          Review applications
        </Link>
      </div>
    </DashboardShell>
  );
}
