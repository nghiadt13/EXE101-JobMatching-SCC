import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { DashboardShell } from '@/components/auth/dashboard-shell';
import { RecruiterApplicationsTable } from '@/components/applications/recruiter-applications-table';
import {
  ApplicationStatus,
  getApplications,
  updateApplicationStatus,
} from '@/lib/applications-client';

const RECRUITER_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  PENDING_MATCHING: ['APPLIED', 'REJECTED'],
  APPLIED: ['REVIEWING', 'REJECTED'],
  REVIEWING: ['INTERVIEW', 'REJECTED'],
  INTERVIEW: ['OFFER', 'REJECTED'],
  OFFER: ['REJECTED'],
  REJECTED: [],
  WITHDRAWN: [],
};

function isRecruiterStatus(value: string): value is Exclude<ApplicationStatus, 'WITHDRAWN'> {
  return (
    value === 'APPLIED' ||
    value === 'REVIEWING' ||
    value === 'INTERVIEW' ||
    value === 'OFFER' ||
    value === 'REJECTED'
  );
}

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
    const currentStatus = String(formData.get('currentStatus') ?? '').trim();
    const notes = String(formData.get('notes') ?? '').trim();
    if (!applicationId || !status || !isRecruiterStatus(status)) return;
    if (!isRecruiterStatus(currentStatus)) return;
    const allowed = RECRUITER_TRANSITIONS[currentStatus] ?? [];
    if (status !== currentStatus && !allowed.includes(status)) return;
    await updateApplicationStatus(currentSession.accessToken, applicationId, {
      status,
      ...(notes ? { notes } : {}),
    });
    revalidatePath('/dashboard/recruiter/applications');
  }

  const applications = await getApplications(session.accessToken, { page: 1, limit: 50 });

  return (
    <DashboardShell
      title="Duyệt đơn ứng tuyển"
      description="Duyệt và cập nhật trạng thái đơn ứng tuyển của ứng viên."
      email={session.user.email}
      userName={session.user.name}
      userAvatarUrl={session.user.image}
      role="RECRUITER"
      currentPath="/dashboard/recruiter/applications"
      breadcrumbs={[
        { label: 'Bảng điều khiển', href: '/dashboard/recruiter' },
        { label: 'Đơn ứng tuyển' },
      ]}
    >
      <RecruiterApplicationsTable items={applications.items} action={updateStatusAction} />
    </DashboardShell>
  );
}

