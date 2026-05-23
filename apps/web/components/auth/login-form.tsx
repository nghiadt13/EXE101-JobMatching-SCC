'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { signIn } from 'next-auth/react';
import { z } from 'zod';
import { PillInput } from '@/components/ui/pill-input';
import { SocialButton } from '@/components/ui/social-button';
import { AuthModal } from '@/components/auth/auth-modal';
import { AuthToast } from '@/components/auth/auth-toast';
import { PUBLIC_JOBS_LISTING_ROUTE } from '@/lib/routes';

const loginSchema = z.object({
  email: z.email('Email is invalid'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

type LoginFormProps = {
  callbackUrl?: string;
};

function safeCallbackUrl(raw: string | undefined): string | null {
  if (!raw) return null;
  const decoded = decodeURIComponent(raw);
  if (decoded.startsWith('/') && !decoded.startsWith('//') && !decoded.includes(':')) {
    return decoded;
  }
  return null;
}

export function LoginForm({ callbackUrl }: LoginFormProps) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState('');
  const [toast, setToast] = useState({ visible: false, message: '', icon: '⚡' });
  const [signinModalOpen, setSigninModalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setSubmitError('');
    const result = await signIn('credentials', {
      email: values.email,
      password: values.password,
      redirect: false,
    });

    if (!result || result.error) {
      setSubmitError('Invalid email or password');
      return;
    }

    const destination = safeCallbackUrl(callbackUrl) ?? PUBLIC_JOBS_LISTING_ROUTE;
    router.push(destination);
    router.refresh();
  };

  const showToast = (message: string, icon = '⚡') => {
    setToast({ visible: true, message, icon });
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
          autoComplete="current-password"
          showToggle
          error={errors.password?.message}
          {...register('password')}
        />

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
          {isSubmitting ? 'Signing in…' : 'Submit'}
        </button>
      </form>

      {/* Social login buttons */}
      <div className="flex gap-3 mt-4">
        <SocialButton provider="apple" onClick={() => showToast('Opening Apple authentication...', '🔄')} />
        <SocialButton provider="google" onClick={() => showToast('Opening Google authentication...', '🔄')} />
      </div>

      {/* Sign-in modal (for "Have any account? Sign in" link context) */}
      <AuthModal
        isOpen={signinModalOpen}
        onClose={() => setSigninModalOpen(false)}
        title="Welcome Back"
      >
        <p className="mb-4 text-xs font-medium text-slate-400">
          Please enter your login credentials to continue.
        </p>
        <div className="space-y-4">
          <PillInput label="Email Address" placeholder="example@gmail.com" type="email" />
          <PillInput label="Password" placeholder="••••••••" type="password" />
        </div>
        <button
          onClick={() => {
            showToast('Connecting to your account...', '🔄');
            setSigninModalOpen(false);
          }}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-full text-xs mt-4 transition-all shadow-md"
        >
          Sign In Now
        </button>
      </AuthModal>

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
