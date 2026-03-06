import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { DashboardShell } from '@/components/auth/dashboard-shell';
import { DashboardStatCard } from '@/components/dashboard/dashboard-stat-card';
import { ApiError } from '@/lib/api-client';
import { getDashboardStats, type CandidateDashboardStats } from '@/lib/dashboard-client';

export default async function CandidateDashboardPage() {
  const session = await auth();
  if (!session?.user || !session.accessToken) {
    redirect('/login');
  }
  if (session.user.role !== 'CANDIDATE') {
    redirect('/dashboard');
  }

  let stats: CandidateDashboardStats = {
    totalApplications: 0,
    pendingApplications: 0,
    interviewCount: 0,
  };
  let errorMessage = '';

  try {
    stats = (await getDashboardStats(session.accessToken)) as CandidateDashboardStats;
  } catch (error) {
    if (error instanceof ApiError) {
      errorMessage = error.message;
    } else {
      errorMessage = 'Failed to load dashboard stats';
    }
  }

  return (
    <DashboardShell
      title="Candidate Dashboard"
      description="Track your applications and update your profile and CV."
      email={session.user.email}
    >
      {errorMessage ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <DashboardStatCard
          label="Total applications"
          value={stats.totalApplications}
          hint="All jobs you have applied to"
        />
        <DashboardStatCard
          label="Pending / Reviewing"
          value={stats.pendingApplications}
          hint="Applications waiting for recruiter decisions"
        />
        <DashboardStatCard
          label="Interviews"
          value={stats.interviewCount}
          hint="Applications currently in interview stage"
        />
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href="/jobs"
          className="inline-flex h-10 items-center justify-center rounded-lg border border-zinc-300 px-4 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
        >
          Browse jobs
        </Link>
        <Link
          href="/dashboard/profile"
          className="inline-flex h-10 items-center justify-center rounded-lg border border-zinc-300 px-4 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
        >
          My profile
        </Link>
        <Link
          href="/dashboard/candidate/cvs"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Manage CVs
        </Link>
        <Link
          href="/dashboard/candidate/applications"
          className="inline-flex h-10 items-center justify-center rounded-lg border border-zinc-300 px-4 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
        >
          My applications
        </Link>
      </div>
    </DashboardShell>
  );
}
