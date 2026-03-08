import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { DashboardShell } from '@/components/auth/dashboard-shell';
import { RecruiterApplicationsTable } from '@/components/applications/recruiter-applications-table';
import { getApplications, updateApplicationStatus } from '@/lib/applications-client';

export default async function RecruiterApplicationsPage() {
  const session = await auth();
  if (!session?.user || !session.accessToken) redirect('/login');
  if (session.user.role !== 'RECRUITER') redirect('/dashboard');

  async function updateStatusAction(formData: FormData) {
    'use server';
    const currentSession = await auth();
    if (!currentSession?.user || !currentSession.accessToken) redirect('/login');
    if (currentSession.user.role !== 'RECRUITER') redirect('/dashboard');
    const applicationId = String(formData.get('applicationId') ?? '').trim();
    const status = String(formData.get('status') ?? '').trim();
    const notes = String(formData.get('notes') ?? '').trim();
    if (!applicationId || !status) return;
    await updateApplicationStatus(currentSession.accessToken, applicationId, {
      status: status as 'APPLIED' | 'REVIEWING' | 'INTERVIEW' | 'OFFER' | 'REJECTED',
      ...(notes ? { notes } : {}),
    });
    revalidatePath('/dashboard/recruiter/applications');
  }

  const applications = await getApplications(session.accessToken, { page: 1, limit: 50 });

  return (
    <DashboardShell
      title="Applications Review"
      description="Review and update the status of candidate applications."
      email={session.user.email}
      role="RECRUITER"
      currentPath="/dashboard/recruiter/applications"
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard/recruiter' },
        { label: 'Applications' },
      ]}
    >
      <RecruiterApplicationsTable items={applications.items} action={updateStatusAction} />
    </DashboardShell>
  );
}
