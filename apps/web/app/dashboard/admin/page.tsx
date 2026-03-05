import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { DashboardShell } from '@/components/auth/dashboard-shell';
import { DashboardStatCard } from '@/components/dashboard/dashboard-stat-card';
import { ApiError } from '@/lib/api-client';
import { getDashboardStats, type AdminDashboardStats } from '@/lib/dashboard-client';

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user || !session.accessToken) {
    redirect('/login');
  }
  if (session.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  let stats: AdminDashboardStats = {
    totalUsers: 0,
    totalRecruiters: 0,
    totalCandidates: 0,
    totalJobs: 0,
    totalApplications: 0,
  };
  let errorMessage = '';

  try {
    stats = (await getDashboardStats(session.accessToken)) as AdminDashboardStats;
  } catch (error) {
    if (error instanceof ApiError) {
      errorMessage = error.message;
    } else {
      errorMessage = 'Failed to load dashboard stats';
    }
  }

  return (
    <DashboardShell
      title="Admin Dashboard"
      description="Manage system-level resources and monitor platform health."
      email={session.user.email}
    >
      {errorMessage ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <DashboardStatCard
          label="Total users"
          value={stats.totalUsers}
          hint="Active users in the platform"
        />
        <DashboardStatCard
          label="Recruiters"
          value={stats.totalRecruiters}
          hint="Active recruiter accounts"
        />
        <DashboardStatCard
          label="Candidates"
          value={stats.totalCandidates}
          hint="Active candidate accounts"
        />
        <DashboardStatCard
          label="Jobs"
          value={stats.totalJobs}
          hint="All jobs across recruiters"
        />
        <DashboardStatCard
          label="Applications"
          value={stats.totalApplications}
          hint="All job applications"
        />
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href="/dashboard/admin/users"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Manage users
        </Link>
        <Link
          href="/dashboard/profile"
          className="inline-flex h-10 items-center justify-center rounded-lg border border-zinc-300 px-4 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
        >
          My profile
        </Link>
      </div>
    </DashboardShell>
  );
}
