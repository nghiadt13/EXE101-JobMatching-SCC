import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { DashboardShell } from '@/components/auth/dashboard-shell';
import { CvPageContent } from '@/components/cv/cv-page-content';
import { SiteFooter } from '@/components/layout/site-footer';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api-client';
import { buildErrorRedirectPath, resolveRouteError } from '@/lib/errors/backend-error-state';
import { deleteCv, getMyCvs, setPrimaryCv, updateCv, uploadCv } from '@/lib/cv-client';

type PageProps = {
  searchParams: Promise<{ error?: string; message?: string; requestId?: string; returnTo?: string }>;
};

export default async function CandidateCvsPage({ searchParams }: PageProps) {
  const query = await searchParams;
  const session = await auth();
  if (!session?.user || !session.accessToken) redirect('/login');
  if (session.user.role !== 'CANDIDATE') redirect('/dashboard');

  // Validate returnTo
  const rawReturnTo = query.returnTo;
  const returnTo =
    rawReturnTo &&
    rawReturnTo.startsWith('/') &&
    !rawReturnTo.startsWith('//') &&
    !rawReturnTo.includes(':')
      ? rawReturnTo
      : null;

  async function setPrimaryAction(cvId: string) {
    'use server';
    const currentSession = await auth();
    if (!currentSession?.user || !currentSession.accessToken) redirect('/login');
    try {
      await setPrimaryCv(currentSession.accessToken, cvId);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) redirect('/api/auth/logout');
    }
    revalidatePath('/dashboard/candidate/cvs');
  }

  async function deleteAction(cvId: string) {
    'use server';
    const currentSession = await auth();
    if (!currentSession?.user || !currentSession.accessToken) redirect('/login');
    try {
      await deleteCv(currentSession.accessToken, cvId);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) redirect('/api/auth/logout');
    }
    revalidatePath('/dashboard/candidate/cvs');
  }

  async function renameAction(cvId: string, newTitle: string) {
    'use server';
    const currentSession = await auth();
    if (!currentSession?.user || !currentSession.accessToken) redirect('/login');
    try {
      await updateCv(currentSession.accessToken, cvId, { parsedData: { summary: newTitle } });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) redirect('/api/auth/logout');
    }
    revalidatePath('/dashboard/candidate/cvs');
  }

  let cvs: Awaited<ReturnType<typeof getMyCvs>>;
  try {
    cvs = await getMyCvs(session.accessToken);
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 401) redirect('/api/auth/logout');
      redirect(buildErrorRedirectPath('/dashboard/candidate/cvs', error, 'load-failed'));
    }
    redirect('/dashboard/candidate/cvs?error=load-failed');
  }

  const routeError = resolveRouteError(query, {
    'missing-file': 'Please choose a file before uploading.',
    'CV_FILE_TOO_LARGE': 'CV file is too large. Maximum size is 5MB.',
    'DOCUMENT_UNSUPPORTED_TYPE': 'Only PDF and DOCX files are supported.',
    'CV_PARSE_FAILED': 'AI parsing failed for this CV. Upload a readable PDF or DOCX and try again.',
    'AI_SERVICE_UNAVAILABLE': 'AI service is temporarily unavailable. Please try uploading again later.',
    'set-primary-failed': 'Setting this CV as primary failed. Please try again.',
    'delete-failed': 'Deleting this CV failed. Please try again.',
    'update-failed': 'Saving CV changes failed. Please try again.',
    'upload-failed': 'Upload failed. Please try again.',
    'load-failed': 'Could not load your CVs. Please try again.',
  });

  const userName = session.user.name?.trim() || session.user.email?.split('@')[0] || 'User';

  return (
    <DashboardShell
      title=""
      description=""
      email={session.user.email}
      userName={session.user.name}
      userAvatarUrl={session.user.image}
      role="CANDIDATE"
      currentPath="/dashboard/candidate/cvs"
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard/candidate' },
        { label: 'CVs' },
      ]}
      actions={
        returnTo ? (
          <Button asChild variant="outline" size="sm">
            <Link href={returnTo}>Return to job</Link>
          </Button>
        ) : undefined
      }
    >
      {routeError ? (
        <Alert className="mb-4" requestId={routeError.requestId}>{routeError.message}</Alert>
      ) : null}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main Content - 2/3 width */}
        <div className="lg:col-span-2">
          <CvPageContent
            items={cvs.items}
            userName={userName}
            onDelete={deleteAction}
            onSetDefault={setPrimaryAction}
            onRename={renameAction}
          />
        </div>

        {/* Right Sidebar - 1/3 width */}
        <div className="col-span-1 flex flex-col gap-8">
          {/* Profile Mini Widget */}
          <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm relative overflow-hidden">
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
          <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm space-y-4">
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

      <SiteFooter />
    </DashboardShell>
  );
}

