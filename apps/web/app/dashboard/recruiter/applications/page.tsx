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

const RECRUITER_TRANSITIONS: Record<string, ApplicationStatus[]> = {
  APPLIED: ['ACCEPTED', 'REJECTED'],
  ACCEPTED: ['REJECTED'],
  REJECTED: [],
};

function isRecruiterStatus(value: string): value is Exclude<ApplicationStatus, 'WITHDRAWN'> {
  return (
    value === 'APPLIED' ||
    value === 'ACCEPTED' ||
    value === 'REJECTED'
  );
}

export default async function RecruiterApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
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

  const params = await searchParams;
  const statusParam = typeof params.status === 'string' ? params.status : 'APPLIED';
  const filterStatus = isRecruiterStatus(statusParam) ? (statusParam as ApplicationStatus) : 'APPLIED';

  const applications = await getApplications(session.accessToken, {
    page: 1,
    limit: 50,
    status: filterStatus,
  });

  const TABS = [
    { label: 'Chưa review', value: 'APPLIED' },
    { label: 'Đã chấp nhận', value: 'ACCEPTED' },
    { label: 'Đã từ chối', value: 'REJECTED' },
  ];

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
      <div className="mb-6 border-b border-md-outline-variant/30 overflow-x-auto">
        <nav className="flex space-x-6 min-w-max px-1" aria-label="Tabs">
          {TABS.map((tab) => {
            const isActive = filterStatus === tab.value;
            return (
              <a
                key={tab.value}
                href={tab.value ? `?status=${tab.value}` : '?'}
                className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  isActive
                    ? 'border-brand-600 text-brand-600'
                    : 'border-transparent text-md-on-surface-variant hover:text-md-on-surface hover:border-md-outline-variant'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                {tab.label}
              </a>
            );
          })}
        </nav>
      </div>

      <RecruiterApplicationsTable items={applications.items} action={updateStatusAction} token={session.accessToken} />
    </DashboardShell>
  );
}
