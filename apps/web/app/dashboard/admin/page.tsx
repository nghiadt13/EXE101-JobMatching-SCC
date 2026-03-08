import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { DashboardShell } from '@/components/auth/dashboard-shell';
import { DashboardStatCard } from '@/components/dashboard/dashboard-stat-card';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api-client';
import { getDashboardStats, type AdminDashboardStats } from '@/lib/dashboard-client';

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user || !session.accessToken) redirect('/login');
  if (session.user.role !== 'ADMIN') redirect('/dashboard');

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
    errorMessage = error instanceof ApiError ? error.message : 'Failed to load dashboard stats';
  }

  return (
    <DashboardShell
      title="Admin Dashboard"
      description="Manage system-level resources and monitor platform health."
      email={session.user.email}
      role="ADMIN"
      currentPath="/dashboard/admin"
    >
      {errorMessage ? <Alert className="mb-4">{errorMessage}</Alert> : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <DashboardStatCard label="Total users" value={stats.totalUsers} hint="Active users in the platform" />
        <DashboardStatCard label="Recruiters" value={stats.totalRecruiters} hint="Active recruiter accounts" />
        <DashboardStatCard label="Candidates" value={stats.totalCandidates} hint="Active candidate accounts" />
        <DashboardStatCard label="Jobs" value={stats.totalJobs} hint="All jobs across recruiters" />
        <DashboardStatCard label="Applications" value={stats.totalApplications} hint="All job applications" />
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/dashboard/admin/users">Manage users</Link>
        </Button>
      </div>
    </DashboardShell>
  );
}
