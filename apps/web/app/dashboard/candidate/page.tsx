import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { DashboardShell } from '@/components/auth/dashboard-shell';
import { StatCardV2 } from '@/components/dashboard/stat-card-v2';
import { RecentApplicationsCard } from '@/components/dashboard/recent-applications-card';
import { RecentActivityCard } from '@/components/dashboard/recent-activity-card';
import { RecommendedJobsSection } from '@/components/dashboard/recommended-jobs-section';
import { SiteFooter } from '@/components/layout/site-footer';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api-client';
import { getDashboardStats, type CandidateDashboardStats } from '@/lib/dashboard-client';
import { getMyCvs } from '@/lib/cv-client';
import { getApplications } from '@/lib/applications-client';
import { Eye, Mail, Briefcase, Upload, TrendingUp, Sparkles } from 'lucide-react';

export default async function CandidateDashboardPage() {
  const session = await auth();
  if (!session?.user || !session.accessToken) redirect('/login');
  if (session.user.role !== 'CANDIDATE') redirect('/dashboard');

  let stats: CandidateDashboardStats = {
    totalApplications: 0,
    pendingApplications: 0,
    interviewCount: 0,
  };
  let cvs: Awaited<ReturnType<typeof getMyCvs>> = { items: [], pagination: { page: 1, limit: 50, totalItems: 0, totalPages: 0 } };
  let applications: Awaited<ReturnType<typeof getApplications>> = { items: [], pagination: { page: 1, limit: 3, totalItems: 0, totalPages: 0 } };
  let errorMessage = '';

  try {
    [stats, cvs, applications] = await Promise.all([
      getDashboardStats(session.accessToken) as Promise<CandidateDashboardStats>,
      getMyCvs(session.accessToken),
      getApplications(session.accessToken, { page: 1, limit: 3 }),
    ]);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) redirect('/api/auth/logout');
    errorMessage = error instanceof ApiError ? error.message : 'Failed to load dashboard data';
  }

  const recentApps = applications.items.slice(0, 3).map((app) => ({
    id: app.id,
    jobTitle: app.job?.title ?? 'Unknown Position',
    companyName: app.job?.title ?? 'Unknown Company',
    status: app.status,
    appliedAt: app.appliedAt,
  }));

  const activities: Array<{ text: string; timeAgo: string; isPrimary?: boolean }> = [];
  if (cvs.items.length > 0) {
    const lastCv = cvs.items[0];
    const updated = new Date(lastCv.updatedAt);
    const daysAgo = Math.max(0, Math.floor((Date.now() - updated.getTime()) / 86400000));
    activities.push({
      text: 'Bạn đã cập nhật CV',
      timeAgo: daysAgo === 0 ? 'Hôm nay' : `${daysAgo} ngày trước`,
      isPrimary: true,
    });
  }
  if (stats.totalApplications > 0) {
    activities.push({
      text: `Bạn đã ứng tuyển ${stats.totalApplications} vị trí`,
      timeAgo: 'Gần đây',
      isPrimary: false,
    });
  }

  const userName = session.user.name?.trim() || session.user.email?.split('@')[0] || 'User';

  return (
    <DashboardShell
      title=""
      description=""
      email={session.user.email}
      userName={session.user.name}
      userAvatarUrl={session.user.image}
      role="CANDIDATE"
      currentPath="/dashboard/candidate"
    >
      {errorMessage ? <Alert className="mb-4">{errorMessage}</Alert> : null}

      {/* Header: Title + Upload Button */}
      <div className="mb-lg flex justify-between items-end">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Tổng quan tài khoản</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-xs">Chào mừng trở lại, xem qua tiến độ của bạn hôm nay.</p>
        </div>
        <Button asChild className="hidden sm:flex items-center gap-sm bg-primary-container text-on-primary px-lg py-sm rounded-lg font-label-md text-label-md hover:opacity-90 transition-opacity shadow-sm">
          <Link href="/dashboard/candidate/cvs">
            <Upload className="h-4 w-4" />
            Tải CV Lên
          </Link>
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-md mb-lg">
        <StatCardV2
          label="Lượt xem hồ sơ"
          value="—"
          icon={<Eye className="h-5 w-5" />}
          iconBg="bg-primary/10"
          iconColor="text-primary"
          subtitle="Dữ liệu đang cập nhật"
        />
        <StatCardV2
          label="Lời mời phỏng vấn"
          value={stats.interviewCount}
          icon={<Mail className="h-5 w-5" />}
          iconBg="bg-tertiary-container/10"
          iconColor="text-tertiary-container"
          subtitle="Cần phản hồi sớm"
          badge={stats.interviewCount > 0 ? { text: 'Mới', variant: 'warning' } : undefined}
        />
        <StatCardV2
          label="Việc làm đã ứng tuyển"
          value={stats.totalApplications}
          icon={<Briefcase className="h-5 w-5" />}
          iconBg="bg-surface-variant"
          iconColor="text-primary"
          subtitle="Tổng số đơn ứng tuyển"
        />
      </div>

      {/* Main Grid: Left (2/3) + Right Sidebar (1/3) */}
      <div className="grid grid-cols-1 gap-lg lg:grid-cols-3">
        {/* Left Column: Recent Applications + Activity + Recommended Jobs */}
        <div className="col-span-1 lg:col-span-2 flex flex-col gap-lg">
          <RecentApplicationsCard applications={recentApps} />
          <RecentActivityCard activities={activities} />
          <RecommendedJobsSection jobs={[]} />
        </div>

        {/* Right Sidebar: Profile + Job Seeking + Recruiter Search */}
        <div className="col-span-1 flex flex-col gap-lg">
          {/* Profile Mini Widget */}
          <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-lg shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-24 h-24 bg-primary/5 rounded-full blur-xl pointer-events-none" />

            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-4">
                <div className="relative w-16 h-16 shrink-0 rounded-2xl overflow-hidden ring-4 ring-slate-100">
                  <div className="flex h-full w-full items-center justify-center rounded-2xl bg-primary-container text-on-primary font-bold text-xl">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="font-bold text-on-surface text-base">{userName}</h4>
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-blue-100 text-blue-800">
                      <span className="material-symbols-outlined text-[12px]">check_circle</span> ĐÃ XÁC THỰC
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-0.5">Thành viên từ {new Date().toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}</p>
                  <Button variant="outline" size="sm" className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold">
                    <span className="material-symbols-outlined text-[14px] text-primary">shield_check</span> Nâng cấp tài khoản PRO
                  </Button>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-outline-variant/30 my-5" />

            {/* Job Seeking Toggle */}
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-surface-container-low p-3 rounded-xl border border-outline-variant/30">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-on-surface-variant">Trạng thái tìm việc</span>
                  <p className="text-sm font-bold text-on-surface-variant">Đang Tắt tìm việc</p>
                </div>
                <button className="w-12 h-6 rounded-full bg-outline-variant p-0.5 transition-all duration-300 focus:outline-none relative">
                  <div className="w-5 h-5 rounded-full bg-white shadow-md transform translate-x-0 transition-transform duration-300 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-outline-variant transition-colors" />
                  </div>
                </button>
              </div>

              {/* Guide Message */}
              <div className="space-y-3 text-xs text-on-surface-variant leading-relaxed bg-amber-50/50 border border-amber-100/50 p-3.5 rounded-xl">
                <div className="flex gap-2">
                  <span className="material-symbols-outlined text-amber-500 text-[16px] shrink-0 mt-0.5">info</span>
                  <p>Khi bật trạng thái tìm việc, hồ sơ của bạn sẽ hiển thị ở vị trí ưu tiên trong danh mục ứng viên tiềm năng để hàng nghìn nhà tuyển dụng tiếp cận.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recruiter Search Setup Widget */}
          <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-lg shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">visibility</span>
              </div>
              <div>
                <h4 className="font-bold text-sm text-on-surface">Cho phép nhà tuyển dụng tìm kiếm</h4>
                <p className="text-[11px] text-on-surface-variant">Cấu hình hồ sơ công khai</p>
              </div>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              Bạn chưa liên kết CV chính thức nào để hiển thị tìm kiếm công khai. Hãy chọn một mẫu CV chuẩn hóa để bật tính năng tự động khớp nối thông minh.
            </p>

            <Button variant="outline" size="sm" className="w-full py-2.5 border-dashed border-outline-variant hover:border-primary text-on-surface-variant hover:text-primary text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5" asChild>
              <Link href="/dashboard/candidate/cvs">
                <span className="material-symbols-outlined text-[16px]">file_check</span> Cấu hình CV chính thức ngay
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Upload FAB */}
      <Link
        href="/dashboard/candidate/cvs"
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary-container text-on-primary shadow-lg transition-colors hover:bg-primary sm:hidden"
      >
        <Upload className="h-6 w-6" />
      </Link>

      <SiteFooter />
    </DashboardShell>
  );
}
