import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { DashboardShell } from '@/components/auth/dashboard-shell';
import { CandidateApplicationsTable } from '@/components/applications/candidate-applications-table';
import { getApplications } from '@/lib/applications-client';
import { Alert } from '@/components/ui/alert';
import { ApiError } from '@/lib/api-client';

type PageProps = {
  searchParams: Promise<{ applied?: string }>;
};

export default async function CandidateApplicationsPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user || !session.accessToken) redirect('/login');
  if (session.user.role !== 'CANDIDATE') redirect('/dashboard');

  const query = await searchParams;
  let applications;
  try {
    applications = await getApplications(session.accessToken, { page: 1, limit: 50 });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) redirect('/api/auth/logout');
    applications = { items: [], pagination: { page: 1, limit: 50, totalItems: 0, totalPages: 0 } };
  }

  return (
    <DashboardShell
      title="My Applications"
      description="Track the status of jobs you have applied to."
      email={session.user.email}
      userName={session.user.name}
      userAvatarUrl={session.user.image}
      role="CANDIDATE"
      currentPath="/dashboard/candidate/applications"
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard/candidate' },
        { label: 'Applications' },
      ]}
    >
      {query.applied === '1' && (
        <Alert variant="success" className="mb-4" role="status" aria-live="polite">
          Application submitted! Your CV is being analyzed — results will appear shortly.
        </Alert>
      )}
      <CandidateApplicationsTable items={applications.items} />
    </DashboardShell>
  );
}
