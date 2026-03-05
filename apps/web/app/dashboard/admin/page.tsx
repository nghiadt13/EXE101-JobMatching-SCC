import { redirect } from 'next/navigation';
import Link from 'next/link';
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
    >
      <div className="flex gap-3">
        <Link
          href="/dashboard/admin/users"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Manage users
        </Link>
        <Link
          href="/dashboard/profile"
          className="inline-flex h-10 items-center justify-center rounded-lg border border-zinc-300 px-4 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
        >
          My profile
        </Link>
      </div>
    </DashboardShell>
  );
}
