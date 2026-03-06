import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { CvList } from '@/components/cv/cv-list';
import { CvUploadForm } from '@/components/cv/cv-upload-form';
import { ApiError } from '@/lib/api-client';
import { deleteCv, getMyCvs, setPrimaryCv, updateCv, uploadCv } from '@/lib/cv-client';

type PageProps = {
  searchParams: Promise<{ error?: string }>;
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
        if (error.status === 413) {
          redirect('/dashboard/candidate/cvs?error=file-too-large');
        }
        if (error.status === 415) {
          redirect('/dashboard/candidate/cvs?error=unsupported-file');
        }
        if (error.status === 422) {
          redirect('/dashboard/candidate/cvs?error=parse-failed');
        }
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
    await setPrimaryCv(currentSession.accessToken, cvId);
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
    await deleteCv(currentSession.accessToken, cvId);
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
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    const summary = String(formData.get('summary') ?? '').trim();

    await updateCv(currentSession.accessToken, cvId, {
      skills,
      parsedData: {
        summary,
      },
    });
    revalidatePath('/dashboard/candidate/cvs');
  }

  const cvs = await getMyCvs(session.accessToken);
  const errorMessage =
    query.error === 'missing-file'
      ? 'Please choose a file before uploading.'
      : query.error === 'file-too-large'
        ? 'CV file is too large. Maximum size is 5MB.'
        : query.error === 'unsupported-file'
          ? 'Only PDF and DOCX files are supported.'
          : query.error === 'parse-failed'
            ? 'Could not read this CV file. Please upload another PDF/DOCX.'
            : query.error === 'upload-failed'
              ? 'Upload failed. Please try again.'
              : null;

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
        {errorMessage ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </p>
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
