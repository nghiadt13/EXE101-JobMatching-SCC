import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AuthLayout } from '@/components/auth/auth-layout';
import { RegisterForm } from '@/components/auth/register-form';
import { getRoleDashboardPath } from '@/lib/auth-redirect';

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user?.role) {
    redirect(getRoleDashboardPath(session.user.role));
  }

  return (
    <AuthLayout>
      <h2 className="text-[32px] font-bold text-neutral-800 tracking-tight mb-1">Create an account</h2>
      <p className="text-[13px] text-slate-400 font-medium mb-8">Sign up and start your job matching journey</p>
      <RegisterForm />
      <div className="flex justify-between items-center text-[12px] text-slate-400 font-medium mt-8 border-t border-slate-200/60 pt-4">
        <span>
          Have any account?{' '}
          <a href="/login" className="text-neutral-800 font-semibold underline underline-offset-2 hover:text-blue-500 transition-colors">
            Sign in
          </a>
        </span>
        <a href="#" className="text-slate-400 underline underline-offset-2 hover:text-neutral-800 transition-colors">
          Terms & Conditions
        </a>
      </div>
    </AuthLayout>
  );
}
