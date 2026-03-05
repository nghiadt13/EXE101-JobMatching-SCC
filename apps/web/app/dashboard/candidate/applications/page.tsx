import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { CandidateApplicationsTable } from '@/components/applications/candidate-applications-table';
import { getApplications } from '@/lib/applications-client';

export default async function CandidateApplicationsPage() {
  const session = await auth();
  if (!session?.user || !session.accessToken) {
    redirect('/login');
  }
  if (session.user.role !== 'CANDIDATE') {
    redirect('/dashboard');
  }

  const applications = await getApplications(session.accessToken, {
    page: 1,
    limit: 50,
  });

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-12">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-zinc-500">Candidate</p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900">My Applications</h1>
        </div>
        <Link href="/dashboard/candidate" className="text-sm font-medium text-zinc-700 underline">
          Back dashboard
        </Link>
      </header>

      <CandidateApplicationsTable items={applications.items} />
    </main>
  );
}
