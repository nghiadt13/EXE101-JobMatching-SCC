import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { DashboardShell } from '@/components/auth/dashboard-shell';

export default async function CandidateDashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }
  if (session.user.role !== 'CANDIDATE') {
    redirect('/dashboard');
  }

  return (
    <DashboardShell
      title="Candidate Dashboard"
      description="Track your applications and update your profile and CV."
      email={session.user.email}
    />
  );
}
