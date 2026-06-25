import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { DashboardShell } from '@/components/auth/dashboard-shell';
import { Alert } from '@/components/ui/alert';
import { ApiError } from '@/lib/api-client';
import { getUserDetail } from '@/lib/users-client';
import { UserDetailOverview } from '@/components/users/user-detail-overview';
import { UserCvList } from '@/components/users/user-cv-list';
import { UserPlanHistory } from '@/components/users/user-plan-history';

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user || !session.accessToken) redirect('/login');
  if (session.user.role !== 'ADMIN') redirect('/dashboard');

  let userDetail;
  let errorMessage = '';

  try {
    userDetail = await getUserDetail(session.accessToken, id);
  } catch (error) {
    errorMessage =
      error instanceof ApiError
        ? error.message
        : 'Không thể tải thông tin người dùng';
  }

  if (errorMessage || !userDetail) {
    return (
      <DashboardShell
        title="Lỗi"
        description={errorMessage || 'Không tìm thấy người dùng'}
        email={session.user.email}
        userName={session.user.name}
        userAvatarUrl={session.user.image}
        role="ADMIN"
        currentPath="/dashboard/admin/users"
        breadcrumbs={[
          { label: 'Bảng điều khiển', href: '/dashboard/admin' },
          { label: 'Người dùng', href: '/dashboard/admin/users' },
          { label: 'Chi tiết' },
        ]}
      >
        <Alert>{errorMessage || 'Không tìm thấy người dùng'}</Alert>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      title={`Chi tiết: ${userDetail.name}`}
      description={userDetail.email}
      email={session.user.email}
      userName={session.user.name}
      userAvatarUrl={session.user.image}
      role="ADMIN"
      currentPath="/dashboard/admin/users"
      breadcrumbs={[
        { label: 'Bảng điều khiển', href: '/dashboard/admin' },
        { label: 'Người dùng', href: '/dashboard/admin/users' },
        { label: userDetail.name },
      ]}
    >
      <div className="space-y-6">
        <UserDetailOverview user={userDetail} />
        <UserCvList cvs={userDetail.cvs} userName={userDetail.name} />
        <UserPlanHistory
          transactions={userDetail.transactions}
          currentPlan={userDetail.planName}
        />
      </div>
    </DashboardShell>
  );
}
