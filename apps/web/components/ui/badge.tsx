import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';
import type { HTMLAttributes } from 'react';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
  {
    variants: {
      variant: {
        default: 'bg-zinc-100 text-zinc-700',
        primary: 'bg-zinc-900 text-white',
        success: 'bg-emerald-100 text-emerald-700',
        warning: 'border border-amber-200 bg-amber-50 text-amber-800',
        danger: 'bg-red-100 text-red-700',
        info: 'border border-blue-200 bg-blue-50 text-blue-700',
        outline: 'border border-zinc-200 bg-zinc-50 text-zinc-700',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

type BadgeProps = HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>;

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}

export { Badge, badgeVariants };
export type { BadgeProps };
