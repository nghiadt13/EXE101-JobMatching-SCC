import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { DashboardShell } from '@/components/auth/dashboard-shell';
import { CandidateApplicationsTable } from '@/components/applications/candidate-applications-table';
import { getApplications } from '@/lib/applications-client';
import { Alert } from '@/components/ui/alert';
import { ApiError } from '@/lib/api-client';

type PageProps = {
  searchParams: Promise<{ applied?: string; status?: string }>;
};

export default async function CandidateApplicationsPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user || !session.accessToken) redirect('/login');
  if (session.user.role !== 'CANDIDATE') redirect('/dashboard');

  const query = await searchParams;
  const statusParam = typeof query.status === 'string' ? query.status : undefined;
  
  let filterStatus: undefined | string = undefined;
  if (['APPLIED', 'REVIEWING', 'INTERVIEW', 'OFFER', 'REJECTED'].includes(statusParam || '')) {
    filterStatus = statusParam;
  }

  let applications;
  try {
    applications = await getApplications(session.accessToken, { 
      page: 1, 
      limit: 50,
      status: filterStatus as any,
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) redirect('/api/auth/logout');
    applications = { items: [], pagination: { page: 1, limit: 50, totalItems: 0, totalPages: 0 } };
  }

  const TABS = [
    { label: 'Tất cả', value: '' },
    { label: 'HR Chưa đọc', value: 'APPLIED' },
    { label: 'Đang xử lý', value: 'REVIEWING' },
    { label: 'Chấp nhận', value: 'INTERVIEW' }, // Interview/Offer are considered accepted
    { label: 'Từ chối', value: 'REJECTED' },
  ];

  return (
    <DashboardShell
      title="Đơn ứng tuyển của tôi"
      description="Theo dõi trạng thái các việc làm bạn đã ứng tuyển."
      email={session.user.email}
      userName={session.user.name}
      userAvatarUrl={session.user.image}
      role="CANDIDATE"
      currentPath="/dashboard/candidate/applications"
      breadcrumbs={[
        { label: 'Bảng điều khiển', href: '/dashboard/candidate' },
        { label: 'Đơn ứng tuyển' },
      ]}
    >
      {query.applied === '1' && (
        <Alert variant="success" className="mb-4" role="status" aria-live="polite">
          Đã nộp đơn ứng tuyển! CV của bạn đang được phân tích — kết quả sẽ hiển thị trong giây lát.
        </Alert>
      )}

      <div className="mb-6 border-b border-zinc-200 overflow-x-auto">
        <nav className="flex space-x-6 min-w-max px-1" aria-label="Tabs">
          {TABS.map((tab) => {
            const isActive = filterStatus ? filterStatus === tab.value : tab.value === '';
            // Match INTERVIEW and OFFER into "Chấp nhận"
            let targetStatus = tab.value;
            
            return (
              <a
                key={tab.value}
                href={`/dashboard/candidate/applications${tab.value ? `?status=${tab.value}` : ''}`}
                className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  isActive
                    ? 'border-brand-600 text-brand-600'
                    : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                {tab.label}
              </a>
            );
          })}
        </nav>
      </div>

      <CandidateApplicationsTable items={applications.items} />
    </DashboardShell>
  );
}
