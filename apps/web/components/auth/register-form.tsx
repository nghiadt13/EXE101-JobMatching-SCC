'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ApiError, registerUser } from '@/lib/api-client';
import { getRoleDashboardPath } from '@/lib/auth-redirect';
import { Button } from '@/components/ui/button';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.email('Email is invalid'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['CANDIDATE', 'RECRUITER']),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState('');
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

  const inputClass =
    'h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium text-zinc-700">Name</label>
        <input id="name" type="text" autoComplete="name" {...register('name')} className={inputClass} />
        {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-zinc-700">Email</label>
        <input id="email" type="email" autoComplete="email" {...register('email')} className={inputClass} />
        {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-zinc-700">Password</label>
        <input id="password" type="password" autoComplete="new-password" {...register('password')} className={inputClass} />
        {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
      </div>

      <div className="space-y-2">
        <label htmlFor="role" className="text-sm font-medium text-zinc-700">Role</label>
        <select id="role" {...register('role')} className={inputClass}>
          <option value="CANDIDATE">Candidate</option>
          <option value="RECRUITER">Recruiter</option>
        </select>
        {errors.role && <p className="text-sm text-red-600">{errors.role.message}</p>}
      </div>

      {submitError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {submitError}
        </div>
      )}

      <Button type="submit" disabled={isSubmitting} className="w-full" size="lg">
        {isSubmitting ? 'Creating account…' : 'Create account'}
      </Button>

      <p className="text-sm text-zinc-600">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-zinc-900 underline">Sign in</Link>
      </p>
    </form>
  );
}
