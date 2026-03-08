import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';
import type { HTMLAttributes, ReactNode } from 'react';

const alertVariants = cva('rounded-lg border px-4 py-3 text-sm', {
  variants: {
    variant: {
      error: 'border-red-200 bg-red-50 text-red-700',
      success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      warning: 'border-amber-200 bg-amber-50 text-amber-700',
      info: 'border-blue-200 bg-blue-50 text-blue-700',
    },
  },
  defaultVariants: {
    variant: 'error',
  },
});

type AlertProps = HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof alertVariants> & {
    requestId?: string | null;
    children: ReactNode;
  };

function Alert({ className, variant, children, requestId, ...props }: AlertProps) {
  return (
    <div role="alert" className={cn(alertVariants({ variant, className }))} {...props}>
      <div>{children}</div>
      {requestId ? (
        <p className="mt-1 text-xs font-medium opacity-80">Request ID: {requestId}</p>
      ) : null}
    </div>
  );
}

export { Alert, alertVariants };
export type { AlertProps };
