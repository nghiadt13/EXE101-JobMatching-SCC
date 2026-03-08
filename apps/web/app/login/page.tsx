import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { LoginForm } from '@/components/auth/login-form';
import { getRoleDashboardPath } from '@/lib/auth-redirect';

export default async function LoginPage() {
  const session = await auth();
  if (session?.user?.role) {
    redirect(getRoleDashboardPath(session.user.role));
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">Sign in</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Use your account credentials to access the platform.
        </p>
        <div className="mt-6">
          <LoginForm />
        </div>
        <p className="mt-4 text-center text-sm text-zinc-500">
          <Link href="/jobs" className="font-medium text-zinc-700 hover:underline">
            Browse open positions →
          </Link>
        </p>
      </div>
    </main>
  );
}
