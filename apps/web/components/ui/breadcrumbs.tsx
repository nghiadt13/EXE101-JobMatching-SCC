import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
  className?: string;
};

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  if (items.length <= 1) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center gap-1 text-sm text-zinc-500', className)}
    >
      {items.map((item, i) => (
        <span key={item.label} className="flex items-center gap-1">
          {i > 0 ? (
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-zinc-400" aria-hidden="true" />
          ) : null}
          {item.href && i < items.length - 1 ? (
            <Link href={item.href} className="transition-colors hover:text-zinc-900">
              {item.label}
            </Link>
          ) : (
            <span className={i === items.length - 1 ? 'font-medium text-zinc-900' : ''}>
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
