import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { DashboardShell } from '@/components/auth/dashboard-shell';
import { CvPageContent } from '@/components/cv/cv-page-content';
import { CvSidebarWidgets } from '@/components/cv/cv-sidebar-widgets';
import { SiteFooter } from '@/components/layout/site-footer';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api-client';
import { buildErrorRedirectPath, resolveRouteError } from '@/lib/errors/backend-error-state';
import { deleteCv, getMyCvs, setPrimaryCv, updateCv } from '@/lib/cv-client';

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
            accessToken={session.accessToken}
          />
        </div>

        {/* Right Sidebar - 1/3 width */}
        <CvSidebarWidgets userName={userName} hasCvs={cvs.items.length > 0} />
      </div>

      <SiteFooter />
    </DashboardShell>
  );
}

