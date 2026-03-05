import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getRoleDashboardPath } from '@/lib/auth-redirect';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  redirect(getRoleDashboardPath(session.user.role));
}
