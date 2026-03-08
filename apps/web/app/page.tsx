import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getRoleDashboardPath } from '@/lib/auth-redirect';
import { Button } from '@/components/ui/button';

export default async function Home() {
  const session = await auth();
  if (session?.user?.role) {
    redirect(getRoleDashboardPath(session.user.role));
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-16">
      <div className="w-full rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
            HR Recruitment Platform
          </p>
          <h1 className="text-3xl font-semibold text-zinc-900">
            Find talent. Land roles.
          </h1>
          <p className="text-zinc-600">
            AI-powered matching between candidates and opportunities. Sign in to access your
            role-based dashboard.
          </p>
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/register">Create account</Link>
          </Button>
          <Button asChild variant="ghost" size="lg">
            <Link href="/jobs">Browse jobs</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
