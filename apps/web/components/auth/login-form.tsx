'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { signIn } from 'next-auth/react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';

const loginSchema = z.object({
  email: z.email('Email is invalid'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState('');
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

    router.push('/dashboard');
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-zinc-700">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          {...register('email')}
          className="h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
        />
        {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-zinc-700">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          {...register('password')}
          className="h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
        />
        {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
      </div>

      {submitError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {submitError}
        </div>
      )}

      <Button type="submit" disabled={isSubmitting} className="w-full" size="lg">
        {isSubmitting ? 'Signing in…' : 'Sign in'}
      </Button>

      <p className="text-sm text-zinc-600">
        New here?{' '}
        <Link href="/register" className="font-medium text-zinc-900 underline">
          Create account
        </Link>
      </p>
    </form>
  );
}
