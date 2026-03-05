import type { ReactNode } from 'react';
import { SignOutButton } from './sign-out-button';

type DashboardShellProps = {
  title: string;
  description: string;
  email?: string | null;
  children?: ReactNode;
};

export function DashboardShell({ title, description, email, children }: DashboardShellProps) {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col px-6 py-12">
      <header className="mb-8 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-zinc-500">Dashboard</p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900">{title}</h1>
          <p className="mt-2 text-zinc-600">{description}</p>
        </div>
        <SignOutButton />
      </header>
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-zinc-500">Signed in as</p>
        <p className="text-lg font-medium text-zinc-900">{email ?? 'Unknown user'}</p>
      </section>
      {children ? <section className="mt-6">{children}</section> : null}
    </main>
  );
}
