'use client';

import { useFormStatus } from 'react-dom';
import { Button, type ButtonProps } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

type PendingButtonProps = ButtonProps & {
  pendingText?: string;
};

export function PendingButton({
  children,
  pendingText,
  className,
  ...props
}: PendingButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button disabled={pending || props.disabled} className={cn(className)} {...props}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {pendingText ?? 'Processing…'}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
