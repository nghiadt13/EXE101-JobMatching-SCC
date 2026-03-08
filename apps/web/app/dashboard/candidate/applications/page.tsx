import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { DashboardShell } from '@/components/auth/dashboard-shell';
import { CandidateApplicationsTable } from '@/components/applications/candidate-applications-table';
import { getApplications } from '@/lib/applications-client';

export default async function CandidateApplicationsPage() {
  const session = await auth();
  if (!session?.user || !session.accessToken) redirect('/login');
  if (session.user.role !== 'CANDIDATE') redirect('/dashboard');

  const applications = await getApplications(session.accessToken, { page: 1, limit: 50 });

  return (
    <DashboardShell
      title="My Applications"
      description="Track the status of jobs you have applied to."
      email={session.user.email}
      role="CANDIDATE"
      currentPath="/dashboard/candidate/applications"
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard/candidate' },
        { label: 'Applications' },
      ]}
    >
      <CandidateApplicationsTable items={applications.items} />
    </DashboardShell>
  );
}
