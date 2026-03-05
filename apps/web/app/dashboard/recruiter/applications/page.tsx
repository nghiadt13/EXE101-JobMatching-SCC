import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { RecruiterApplicationsTable } from '@/components/applications/recruiter-applications-table';
import { getApplications, updateApplicationStatus } from '@/lib/applications-client';

export default async function RecruiterApplicationsPage() {
  const session = await auth();
  if (!session?.user || !session.accessToken) {
    redirect('/login');
  }
  if (session.user.role !== 'RECRUITER') {
    redirect('/dashboard');
  }

  async function updateStatusAction(formData: FormData) {
    'use server';
    const currentSession = await auth();
    if (!currentSession?.user || !currentSession.accessToken) {
      redirect('/login');
    }
    if (currentSession.user.role !== 'RECRUITER') {
      redirect('/dashboard');
    }
    const applicationId = String(formData.get('applicationId') ?? '').trim();
    const status = String(formData.get('status') ?? '').trim();
    const notes = String(formData.get('notes') ?? '').trim();
    if (!applicationId || !status) {
      return;
    }
    await updateApplicationStatus(currentSession.accessToken, applicationId, {
      status: status as 'APPLIED' | 'REVIEWING' | 'INTERVIEW' | 'OFFER' | 'REJECTED',
      ...(notes ? { notes } : {}),
    });
    revalidatePath('/dashboard/recruiter/applications');
  }

  const applications = await getApplications(session.accessToken, {
    page: 1,
    limit: 50,
  });

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-12">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-zinc-500">Recruiter</p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900">Applications Review</h1>
        </div>
        <Link href="/dashboard/recruiter" className="text-sm font-medium text-zinc-700 underline">
          Back dashboard
        </Link>
      </header>

      <RecruiterApplicationsTable items={applications.items} action={updateStatusAction} />
    </main>
  );
}
