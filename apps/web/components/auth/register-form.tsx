'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { signIn } from 'next-auth/react';
import { z } from 'zod';
import { ApiError, registerUser, type UserRole } from '@/lib/api-client';
import { getRoleDashboardPath } from '@/lib/auth-redirect';
import { PillInput } from '@/components/ui/pill-input';
import { SocialButton } from '@/components/ui/social-button';
import { AuthToast } from '@/components/auth/auth-toast';
import { useSocialAuthErrorToast } from '@/components/auth/use-social-auth-error';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.email('Email is invalid'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['CANDIDATE', 'RECRUITER']),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

type SignupRole = Extract<UserRole, 'CANDIDATE' | 'RECRUITER'>;

/**
 * Persist the selected signup role in a short-lived cookie so the NextAuth
 * `signIn` callback can read it server-side after the OAuth round-trip.
 * Lifetime: 300s (5 minutes) — long enough for the OAuth redirect, short
 * enough to avoid leaking stale state across sessions.
 */
function persistSignupRole(role: SignupRole) {
  document.cookie = `social_signup_role=${role}; path=/; max-age=300`;
}

export function RegisterForm() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState('');
  const [toast, setToast] = useState({ visible: false, message: '', icon: '⚡' });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', role: 'CANDIDATE' },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setSubmitError('');
    try {
      const registerResponse = await registerUser(values);
      const signInResponse = await signIn('credentials', {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (!signInResponse || signInResponse.error) {
        setSubmitError('Account created but sign in failed. Please sign in manually.');
        return;
      }

      router.push(getRoleDashboardPath(registerResponse.user.role));
      router.refresh();
    } catch (error) {
      if (error instanceof ApiError) {
        setSubmitError(error.message);
        return;
      }
      setSubmitError('Failed to create account');
    }
  };

  const showToast = (message: string, icon = '⚡') => {
    setToast({ visible: true, message, icon });
  };

  // Surface NextAuth `?error=` failures (cancellation, backend outages, etc.)
  // as toasts so the user sees Req 5.1 / Req 5.3 messaging if NextAuth ever
  // redirects back here with an error.
  useSocialAuthErrorToast(showToast);

  const handleSocialSignIn = (provider: 'google' | 'facebook', role: SignupRole) => {
    persistSignupRole(role);
    void signIn(provider, { callbackUrl: getRoleDashboardPath(role) });
  };

  const handleAppleClick = (role: SignupRole) => {
    persistSignupRole(role);
    showToast(`Opening Apple authentication for ${role.toLowerCase()}...`, '🔄');
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <PillInput
          label="Full Name"
          type="text"
          placeholder="Amélie Laurent"
          autoComplete="name"
          error={errors.name?.message}
          {...register('name')}
        />

        <PillInput
          label="Email"
          type="email"
          placeholder="amelilaurent7622@gmail.com"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />

        <PillInput
          label="Password"
          placeholder="••••••••••••••••••••••••"
          autoComplete="new-password"
          showToggle
          error={errors.password?.message}
          {...register('password')}
        />

        {/* Role selector as hidden field — default CANDIDATE */}
        <input type="hidden" {...register('role')} />

        {submitError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {submitError}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-500 hover:bg-blue-600 active:scale-[0.98] text-white font-bold py-4 px-6 rounded-full shadow-[0_4px_18px_rgba(59,130,246,0.2)] transition-all duration-300 text-[14px] tracking-wide mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Creating account…' : 'Submit'}
        </button>
      </form>

      {/* Two clearly labeled social-signup zones — Candidate vs Recruiter */}
      <div className="mt-6 space-y-5">
        {/* Candidate zone */}
        <section
          aria-labelledby="social-zone-candidate"
          className="rounded-2xl border border-slate-200/60 bg-white/40 p-4"
        >
          <h3
            id="social-zone-candidate"
            className="text-[12px] font-semibold text-neutral-800 mb-3"
          >
            Dành cho Người tìm việc (CANDIDATE)
          </h3>
          <div className="flex gap-3">
            <SocialButton provider="apple" onClick={() => handleAppleClick('CANDIDATE')} />
            <SocialButton
              provider="google"
              onClick={() => handleSocialSignIn('google', 'CANDIDATE')}
            />
            <SocialButton
              provider="facebook"
              onClick={() => handleSocialSignIn('facebook', 'CANDIDATE')}
            />
          </div>
        </section>

        {/* Recruiter zone */}
        <section
          aria-labelledby="social-zone-recruiter"
          className="rounded-2xl border border-slate-200/60 bg-white/40 p-4"
        >
          <h3
            id="social-zone-recruiter"
            className="text-[12px] font-semibold text-neutral-800 mb-3"
          >
            Dành cho Nhà tuyển dụng (RECRUITER)
          </h3>
          <div className="flex gap-3">
            <SocialButton provider="apple" onClick={() => handleAppleClick('RECRUITER')} />
            <SocialButton
              provider="google"
              onClick={() => handleSocialSignIn('google', 'RECRUITER')}
            />
            <SocialButton
              provider="facebook"
              onClick={() => handleSocialSignIn('facebook', 'RECRUITER')}
            />
          </div>
        </section>
      </div>

      {/* Toast */}
      <AuthToast
        message={toast.message}
        icon={toast.icon}
        isVisible={toast.visible}
        onDismiss={() => setToast((prev) => ({ ...prev, visible: false }))}
      />
    </>
  );
}
