import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { DashboardShell } from '@/components/auth/dashboard-shell';

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }
  if (session.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  return (
    <DashboardShell
      title="Admin Dashboard"
      description="Manage system-level resources and monitor platform health."
      email={session.user.email}
    />
  );
}
