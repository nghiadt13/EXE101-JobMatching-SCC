import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { RegisterForm } from '@/components/auth/register-form';
import { getRoleDashboardPath } from '@/lib/auth-redirect';

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user?.role) {
    redirect(getRoleDashboardPath(session.user.role));
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">Create account</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Candidate and recruiter accounts are available for public registration.
        </p>
        <div className="mt-6">
          <RegisterForm />
        </div>
      </div>
    </main>
  );
}
