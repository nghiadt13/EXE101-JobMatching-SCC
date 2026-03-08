import { cn } from '@/lib/cn';
import type { ReactNode } from 'react';

type PageHeaderProps = {
  overline?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
};

export function PageHeader({ overline, title, description, actions, className }: PageHeaderProps) {
  return (
    <header className={cn('mb-6 flex flex-wrap items-start justify-between gap-4', className)}>
      <div>
        {overline ? (
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-zinc-500">
            {overline}
          </p>
        ) : null}
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm text-zinc-600">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
