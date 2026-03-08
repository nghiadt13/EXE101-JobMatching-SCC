import { cn } from '@/lib/cn';
import type { ReactNode } from 'react';

type EmptyStateProps = {
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <section
      className={cn(
        'rounded-2xl border border-dashed border-zinc-300 bg-white/60 p-8 text-center',
        className,
      )}
    >
      {title ? <h3 className="text-base font-semibold text-zinc-700">{title}</h3> : null}
      {description ? <p className="mt-2 text-sm text-zinc-500">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </section>
  );
}
