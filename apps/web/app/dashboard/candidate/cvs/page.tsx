import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { DashboardShell } from '@/components/auth/dashboard-shell';
import { CvList } from '@/components/cv/cv-list';
import { CvUploadForm } from '@/components/cv/cv-upload-form';
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

  // Validate returnTo — only allow internal relative paths
  const rawReturnTo = query.returnTo;
  const returnTo =
    rawReturnTo &&
    rawReturnTo.startsWith('/') &&
    !rawReturnTo.startsWith('//') &&
    !rawReturnTo.includes(':')
      ? rawReturnTo
      : null;

  async function uploadAction(formData: FormData) {
    'use server';
    const currentSession = await auth();
    if (!currentSession?.user || !currentSession.accessToken) redirect('/login');
    if (currentSession.user.role !== 'CANDIDATE') redirect('/dashboard');

    const file = formData.get('file');
    if (!(file instanceof File)) redirect('/dashboard/candidate/cvs?error=missing-file');

    try {
      await uploadCv(currentSession.accessToken, file);
      revalidatePath('/dashboard/candidate/cvs');
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401) redirect('/login');
        redirect(buildErrorRedirectPath('/dashboard/candidate/cvs', error, 'upload-failed'));
      }
      redirect('/dashboard/candidate/cvs?error=upload-failed');
    }
  }

  async function setPrimaryAction(formData: FormData) {
    'use server';
    const currentSession = await auth();
    if (!currentSession?.user || !currentSession.accessToken) redirect('/login');
    const cvId = String(formData.get('cvId') ?? '').trim();
    if (!cvId) return;
    try {
      await setPrimaryCv(currentSession.accessToken, cvId);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401) redirect('/login');
        redirect(buildErrorRedirectPath('/dashboard/candidate/cvs', error, 'set-primary-failed'));
      }
      redirect('/dashboard/candidate/cvs?error=set-primary-failed');
    }
    revalidatePath('/dashboard/candidate/cvs');
  }

  async function deleteAction(formData: FormData) {
    'use server';
    const currentSession = await auth();
    if (!currentSession?.user || !currentSession.accessToken) redirect('/login');
    const cvId = String(formData.get('cvId') ?? '').trim();
    if (!cvId) return;
    try {
      await deleteCv(currentSession.accessToken, cvId);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401) redirect('/login');
        redirect(buildErrorRedirectPath('/dashboard/candidate/cvs', error, 'delete-failed'));
      }
      redirect('/dashboard/candidate/cvs?error=delete-failed');
    }
    revalidatePath('/dashboard/candidate/cvs');
  }

  async function updateAction(formData: FormData) {
    'use server';
    const currentSession = await auth();
    if (!currentSession?.user || !currentSession.accessToken) redirect('/login');
    const cvId = String(formData.get('cvId') ?? '').trim();
    if (!cvId) return;

    const skills = String(formData.get('skills') ?? '').split('\n').map((item) => item.trim()).filter(Boolean);
    const summary = String(formData.get('summary') ?? '').trim();
    const languages = String(formData.get('languages') ?? '').split(/[\n,]/g).map((item) => item.trim()).filter(Boolean);

    try {
      await updateCv(currentSession.accessToken, cvId, { skills, parsedData: { summary, languages } });
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401) redirect('/login');
        redirect(buildErrorRedirectPath('/dashboard/candidate/cvs', error, 'update-failed'));
      }
      redirect('/dashboard/candidate/cvs?error=update-failed');
    }
    revalidatePath('/dashboard/candidate/cvs');
  }

  const cvs = await getMyCvs(session.accessToken);
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
  });

  return (
    <DashboardShell
      title="CV Management"
      description="Upload, review, and manage your CVs."
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
            <Link href={returnTo}>← Return to job</Link>
          </Button>
        ) : undefined
      }
    >
      <div className="grid gap-6">
        {routeError ? (
          <Alert requestId={routeError.requestId}>{routeError.message}</Alert>
        ) : null}
        <CvUploadForm uploadAction={uploadAction} />
        <CvList
          items={cvs.items}
          setPrimaryAction={setPrimaryAction}
          deleteAction={deleteAction}
          updateAction={updateAction}
        />
      </div>
    </DashboardShell>
  );
}

