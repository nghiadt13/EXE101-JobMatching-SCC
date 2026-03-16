import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { DashboardShell } from '@/components/auth/dashboard-shell';
import { DashboardStatCard } from '@/components/dashboard/dashboard-stat-card';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api-client';
import { getDashboardStats, type CandidateDashboardStats } from '@/lib/dashboard-client';
import { PUBLIC_JOBS_LISTING_ROUTE } from '@/lib/routes';

export default async function CandidateDashboardPage() {
  const session = await auth();
  if (!session?.user || !session.accessToken) redirect('/login');
  if (session.user.role !== 'CANDIDATE') redirect('/dashboard');

  let stats: CandidateDashboardStats = {
    totalApplications: 0,
    pendingApplications: 0,
    interviewCount: 0,
  };
  let errorMessage = '';

  try {
    stats = (await getDashboardStats(session.accessToken)) as CandidateDashboardStats;
  } catch (error) {
    errorMessage = error instanceof ApiError ? error.message : 'Failed to load dashboard stats';
  }

  return (
    <DashboardShell
      title="Candidate Dashboard"
      description="Track your applications and update your profile and CV."
      email={session.user.email}
      userName={session.user.name}
      userAvatarUrl={session.user.image}
      role="CANDIDATE"
      currentPath="/dashboard/candidate"
    >
      {errorMessage ? <Alert className="mb-4">{errorMessage}</Alert> : null}

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
        <Button asChild>
          <Link href="/dashboard/candidate/cvs">Manage CVs</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={PUBLIC_JOBS_LISTING_ROUTE}>Browse jobs</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/dashboard/candidate/applications">My applications</Link>
        </Button>
        <Button asChild>
          <Link href="/dashboard/candidate/recommendations">🔍 Smart Job Match</Link>
        </Button>
      </div>
    </DashboardShell>
  );
}

