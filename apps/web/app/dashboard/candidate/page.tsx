import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { DashboardShell } from '@/components/auth/dashboard-shell';
import { StatCardV2 } from '@/components/dashboard/stat-card-v2';
import { CvStrengthCard } from '@/components/dashboard/cv-strength-card';
import { SkillsKeywordsCard } from '@/components/dashboard/skills-keywords-card';
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
import { getJobs } from '@/lib/jobs-client';
import { Eye, Mail, Briefcase, Upload } from 'lucide-react';

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
    errorMessage = error instanceof ApiError ? error.message : 'Không thể tải dữ liệu bảng điều khiển';
  }

  // Parse Applications data
  const recentApps = applications.items.slice(0, 3).map((app) => ({
    id: app.id,
    jobTitle: app.job?.title ?? 'Unknown Position',
    companyName: app.job?.companyName ?? 'Confidential Company',
    status: app.status,
    appliedAt: app.appliedAt,
  }));

  // Parse Recent Activities
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

  // Dynamic CV Strength Calculation
  const primaryCv = cvs.items.find((cv) => cv.isPrimary) || cvs.items[0];

  let cvScore = 75; // Baseline default matching mockup
  let improvementItems = ['Thêm kinh nghiệm làm việc', 'Cập nhật học văn'];
  let cvSkills = ['ReactJS', 'Tailwind CSS', 'Figma', 'JavaScript', 'HTML/CSS'];

  if (primaryCv) {
    cvScore = 40; // baseline for raw CV
    improvementItems = [];
    
    const profile = primaryCv.candidateProfile || primaryCv.normalizedProfile;
    const skillsList = primaryCv.skills || profile?.skills || [];
    if (skillsList.length > 0) {
      cvSkills = skillsList.slice(0, 8);
      cvScore += Math.min(20, skillsList.length * 2);
    } else {
      improvementItems.push('Thêm kỹ năng nổi bật');
    }

    const experience = profile?.experience || [];
    if (experience.length > 0) {
      cvScore += 20;
    } else {
      improvementItems.push('Thêm kinh nghiệm làm việc');
    }

    const education = profile?.education || [];
    if (education.length > 0) {
      cvScore += 20;
    } else {
      improvementItems.push('Cập nhật học văn');
    }

    cvScore = Math.min(100, cvScore);
  }

  // Fetch real published jobs for recommendations
  let recommendedJobs: Array<{
    id: string;
    title: string;
    companyName: string;
    location: string;
    matchScore: number;
    matchTier: 'excellent' | 'good' | 'potential' | 'low';
    skills: string[];
    salary?: string;
  }> = [];

  try {
    const jobsResponse = await getJobs({ status: 'PUBLISHED', limit: 3 }, session.accessToken);
    recommendedJobs = jobsResponse.items.map((job, idx) => {
      const loc = job.location as Record<string, string> | null;
      const locationStr = loc?.city || loc?.country || 'Việt Nam';
      const salaryStr = job.salaryMin && job.salaryMax
        ? `${(job.salaryMin / 1_000_000).toFixed(0)} - ${(job.salaryMax / 1_000_000).toFixed(0)} triệu`
        : job.salaryNegotiable ? 'Thương lượng' : undefined;
      const scores = [92, 85, 78];
      const tiers: Array<'excellent' | 'good' | 'potential'> = ['excellent', 'good', 'potential'];
      return {
        id: job.slug,
        title: job.title,
        companyName: job.companyName ?? 'Công ty',
        location: locationStr,
        matchScore: scores[idx] ?? 75,
        matchTier: tiers[idx] ?? 'potential',
        skills: (job.skills || []).slice(0, 4),
        salary: salaryStr,
      };
    });
  } catch {
    // Silently fail — will show empty state
  }

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
        <Button asChild className="hidden sm:flex items-center gap-sm bg-primary-container text-white px-lg py-sm rounded-lg font-label-md text-label-md hover:opacity-90 transition-opacity shadow-sm border-0">
          <Link href="/dashboard/candidate/cvs" className="text-white">
            <Upload className="h-4 w-4 text-white" />
            Tải CV Lên
          </Link>
        </Button>
      </div>

      {/* Stats Overview Section */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-md mb-lg">
        <StatCardV2
          label="Lượt xem hồ sơ"
          value="124"
          icon={<Eye className="h-5 w-5" />}
          iconBg="bg-primary/10"
          iconColor="text-primary"
          subtitle="So với tuần trước"
          trend={{ text: '+12%', direction: 'up' }}
        />
        <StatCardV2
          label="Lời mời phỏng vấn"
          value="5"
          icon={<Mail className="h-5 w-5" />}
          iconBg="bg-tertiary-container/10"
          iconColor="text-tertiary-container"
          subtitle="Cần phản hồi sớm"
          badge={{ text: 'Mới', variant: 'warning' }}
        />
        <StatCardV2
          label="Việc làm mới phù hợp"
          value="18"
          icon={<Briefcase className="h-5 w-5" />}
          iconBg="bg-surface-variant"
          iconColor="text-primary"
          subtitle="Dựa trên kỹ năng ReactJS"
          badge={{ text: 'Hôm nay', variant: 'primary' }}
        />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 gap-lg lg:grid-cols-3 mb-lg">
        {/* Left Column: CV Strength & Skills (1/3) */}
        <div className="col-span-1 flex flex-col gap-lg">
          <CvStrengthCard score={cvScore} improvementItems={improvementItems} />
          <SkillsKeywordsCard skills={cvSkills} />
        </div>

        {/* Right Column: Recent Applications & Activity (2/3) */}
        <div className="col-span-1 lg:col-span-2 flex flex-col gap-lg">
          <RecentApplicationsCard applications={recentApps} />
          <RecentActivityCard activities={activities} />
        </div>
      </div>

      {/* Recommended Jobs Section (Full Width) */}
      <div className="w-full mb-lg">
        <RecommendedJobsSection jobs={recommendedJobs} />
      </div>

      {/* Mobile Upload FAB */}
      <Link
        href="/dashboard/candidate/cvs"
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary-container text-white shadow-lg transition-colors hover:bg-primary sm:hidden"
      >
        <Upload className="h-6 w-6 text-white" />
      </Link>

      <SiteFooter />
    </DashboardShell>
  );
}
