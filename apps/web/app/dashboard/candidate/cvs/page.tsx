import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { CvList } from '@/components/cv/cv-list';
import { CvUploadForm } from '@/components/cv/cv-upload-form';
import { ApiError } from '@/lib/api-client';
import {
  buildErrorRedirectPath,
  resolveRouteError,
} from '@/lib/errors/backend-error-state';
import { deleteCv, getMyCvs, setPrimaryCv, updateCv, uploadCv } from '@/lib/cv-client';

type PageProps = {
  searchParams: Promise<{ error?: string; message?: string; requestId?: string }>;
};

export default async function CandidateCvsPage({ searchParams }: PageProps) {
  const query = await searchParams;
  const session = await auth();
  if (!session?.user || !session.accessToken) {
    redirect('/login');
  }
  if (session.user.role !== 'CANDIDATE') {
    redirect('/dashboard');
  }

  async function uploadAction(formData: FormData) {
    'use server';
    const currentSession = await auth();
    if (!currentSession?.user || !currentSession.accessToken) {
      redirect('/login');
    }
    if (currentSession.user.role !== 'CANDIDATE') {
      redirect('/dashboard');
    }

    const file = formData.get('file');
    if (!(file instanceof File)) {
      redirect('/dashboard/candidate/cvs?error=missing-file');
    }

    try {
      await uploadCv(currentSession.accessToken, file);
      revalidatePath('/dashboard/candidate/cvs');
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401) {
          redirect('/login');
        }
        redirect(buildErrorRedirectPath('/dashboard/candidate/cvs', error, 'upload-failed'));
      }
      redirect('/dashboard/candidate/cvs?error=upload-failed');
    }
  }

  async function setPrimaryAction(formData: FormData) {
    'use server';
    const currentSession = await auth();
    if (!currentSession?.user || !currentSession.accessToken) {
      redirect('/login');
    }
    const cvId = String(formData.get('cvId') ?? '').trim();
    if (!cvId) {
      return;
    }
    try {
      await setPrimaryCv(currentSession.accessToken, cvId);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401) {
          redirect('/login');
        }
        redirect(buildErrorRedirectPath('/dashboard/candidate/cvs', error, 'set-primary-failed'));
      }
      redirect('/dashboard/candidate/cvs?error=set-primary-failed');
    }
    revalidatePath('/dashboard/candidate/cvs');
  }

  async function deleteAction(formData: FormData) {
    'use server';
    const currentSession = await auth();
    if (!currentSession?.user || !currentSession.accessToken) {
      redirect('/login');
    }
    const cvId = String(formData.get('cvId') ?? '').trim();
    if (!cvId) {
      return;
    }
    try {
      await deleteCv(currentSession.accessToken, cvId);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401) {
          redirect('/login');
        }
        redirect(buildErrorRedirectPath('/dashboard/candidate/cvs', error, 'delete-failed'));
      }
      redirect('/dashboard/candidate/cvs?error=delete-failed');
    }
    revalidatePath('/dashboard/candidate/cvs');
  }

  async function updateAction(formData: FormData) {
    'use server';
    const currentSession = await auth();
    if (!currentSession?.user || !currentSession.accessToken) {
      redirect('/login');
    }
    const cvId = String(formData.get('cvId') ?? '').trim();
    if (!cvId) {
      return;
    }

    const skills = String(formData.get('skills') ?? '')
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean);
    const summary = String(formData.get('summary') ?? '').trim();
    const languages = String(formData.get('languages') ?? '')
      .split(/[\n,]/g)
      .map((item) => item.trim())
      .filter(Boolean);

    try {
      await updateCv(currentSession.accessToken, cvId, {
        skills,
        parsedData: {
          summary,
          languages,
        },
      });
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401) {
          redirect('/login');
        }
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
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-12">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-zinc-500">Candidate</p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900">CV Management</h1>
        </div>
        <Link href="/dashboard/candidate" className="text-sm font-medium text-zinc-700 underline">
          Back dashboard
        </Link>
      </header>

      <div className="grid gap-6">
        {routeError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <p>{routeError.message}</p>
            {routeError.requestId ? (
              <p className="mt-1 text-xs font-medium text-red-800/80">Request ID: {routeError.requestId}</p>
            ) : null}
          </div>
        ) : null}
        <CvUploadForm uploadAction={uploadAction} />
        <CvList
          items={cvs.items}
          setPrimaryAction={setPrimaryAction}
          deleteAction={deleteAction}
          updateAction={updateAction}
        />
      </div>
    </main>
  );
}
