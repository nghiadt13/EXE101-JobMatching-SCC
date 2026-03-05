import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { CvList } from '@/components/cv/cv-list';
import { CvUploadForm } from '@/components/cv/cv-upload-form';
import { deleteCv, getMyCvs, setPrimaryCv, updateCv, uploadCv } from '@/lib/cv-client';

export default async function CandidateCvsPage() {
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
      return;
    }

    await uploadCv(currentSession.accessToken, file);
    revalidatePath('/dashboard/candidate/cvs');
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
