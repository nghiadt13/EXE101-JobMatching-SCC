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
    errorMessage = error instanceof ApiError ? error.message : 'Không thể tải dữ liệu bảng điều khiển';
  }

  return (
    <DashboardShell
      title="Bảng điều khiển quản trị"
      description="Quản lý tài nguyên cấp hệ thống và theo dõi sức khỏe nền tảng."
      email={session.user.email}
      userName={session.user.name}
      userAvatarUrl={session.user.image}
      role="ADMIN"
      currentPath="/dashboard/admin"
    >
      {errorMessage ? <Alert className="mb-4">{errorMessage}</Alert> : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <DashboardStatCard label="Tổng người dùng" value={stats.totalUsers} hint="Người dùng đang hoạt động trên nền tảng" href="/dashboard/admin/users" />
        <DashboardStatCard label="Nhà tuyển dụng" value={stats.totalRecruiters} hint="Tài khoản nhà tuyển dụng đang hoạt động" />
        <DashboardStatCard label="Ứng viên" value={stats.totalCandidates} hint="Tài khoản ứng viên đang hoạt động" />
        <DashboardStatCard label="Việc làm" value={stats.totalJobs} hint="Tất cả việc làm từ nhà tuyển dụng" />
        <DashboardStatCard label="Đơn ứng tuyển" value={stats.totalApplications} hint="Tất cả đơn ứng tuyển việc làm" />
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/dashboard/admin/users">Quản lý người dùng</Link>
        </Button>
      </div>
    </DashboardShell>
  );
}

