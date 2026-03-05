import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getRoleDashboardPath } from '@/lib/auth-redirect';

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
          <h1 className="text-3xl font-semibold text-zinc-900">Authentication Ready</h1>
          <p className="text-zinc-600">
            Continue with email/password credentials to access role-based dashboard.
          </p>
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/login"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-zinc-900 px-5 text-sm font-medium text-white transition hover:bg-zinc-700"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-zinc-300 px-5 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100"
          >
            Create account
          </Link>
        </div>
      </div>
    </main>
  );
}
