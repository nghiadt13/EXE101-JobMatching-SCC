import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { DashboardShell } from '@/components/auth/dashboard-shell';

export default async function RecruiterDashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }
  if (session.user.role !== 'RECRUITER') {
    redirect('/dashboard');
  }

  return (
    <DashboardShell
      title="Recruiter Dashboard"
      description="Manage jobs, review candidates, and track application progress."
      email={session.user.email}
    />
  );
}
