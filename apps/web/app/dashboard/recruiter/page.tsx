import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { DashboardShell } from '@/components/auth/dashboard-shell';
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

  const firstName = session.user.name?.split(' ')[0] || 'Recruiter';

  return (
    <DashboardShell
      title="Recruiter Dashboard"
      description="Manage jobs, review candidates, and track application progress."
      email={session.user.email}
      userName={session.user.name}
      userAvatarUrl={session.user.image}
      role="RECRUITER"
      currentPath="/dashboard/recruiter"
    >
      {errorMessage ? <Alert className="mb-4">{errorMessage}</Alert> : null}

      {/* Welcome Banner */}
      <div
        className="relative mb-6 overflow-hidden rounded-2xl p-6 text-white sm:p-8"
        style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 40%, #2563eb 100%)' }}
      >
        <div className="relative z-10">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold sm:text-2xl">
                Welcome back, {firstName}!
              </h2>
              <p className="mt-1 text-sm text-primary-200/90">
                Here&apos;s an overview of your recruitment pipeline today.
              </p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 sm:mt-0">
              <Link
                href="/dashboard/recruiter/jobs"
                className="inline-flex items-center gap-1.5 rounded-lg bg-white/20 px-3 py-2 text-xs font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/30"
              >
                <i className="fa-solid fa-plus text-[10px]" /> Post a Job
              </Link>
              <Link
                href="/dashboard/recruiter/applications"
                className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-white/90 backdrop-blur-sm transition-colors hover:bg-white/20"
              >
                <i className="fa-solid fa-clipboard-check text-[10px]" /> Review Applications
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stat Cards with Icons */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/dashboard/recruiter/jobs"
          className="group rounded-2xl border border-primary-100 bg-white p-5 shadow-sm transition-all hover:border-primary-200 hover:shadow-md"
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600 transition-colors group-hover:bg-primary-100">
            <i className="fa-solid fa-briefcase" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary-600">Total jobs</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{stats.totalJobs}</p>
          <p className="mt-1 text-sm text-slate-500">All jobs you created</p>
        </Link>

        <Link
          href="/dashboard/recruiter/jobs"
          className="group rounded-2xl border border-primary-100 bg-white p-5 shadow-sm transition-all hover:border-primary-200 hover:shadow-md"
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-100">
            <i className="fa-solid fa-rocket" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-indigo-600">Published jobs</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{stats.activeJobs}</p>
          <p className="mt-1 text-sm text-slate-500">Currently visible to candidates</p>
        </Link>

        <Link
          href="/dashboard/recruiter/applications"
          className="group rounded-2xl border border-primary-100 bg-white p-5 shadow-sm transition-all hover:border-primary-200 hover:shadow-md"
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100">
            <i className="fa-solid fa-users" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-600">Applications</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{stats.totalApplications}</p>
          <p className="mt-1 text-sm text-slate-500">Received for your jobs</p>
        </Link>

        <Link
          href="/dashboard/recruiter/applications"
          className="group rounded-2xl border border-amber-100 bg-white p-5 shadow-sm transition-all hover:border-amber-200 hover:shadow-md"
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 transition-colors group-hover:bg-amber-100">
            <i className="fa-solid fa-clock" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-600">Pending review</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{stats.pendingReview}</p>
          <p className="mt-1 text-sm text-slate-500">Waiting for your action</p>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/dashboard/recruiter/jobs">
            <i className="fa-solid fa-briefcase mr-1.5 text-xs" /> Manage jobs
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/dashboard/recruiter/applications">
            <i className="fa-solid fa-clipboard-list mr-1.5 text-xs" /> Review applications
          </Link>
        </Button>
      </div>
    </DashboardShell>
  );
}
