import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';
import type { ButtonHTMLAttributes } from 'react';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60',
  {
    variants: {
      variant: {
        default: 'bg-zinc-900 text-white hover:bg-zinc-700',
        outline: 'border border-zinc-300 text-zinc-800 hover:bg-zinc-100',
        ghost: 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900',
        danger: 'border border-red-200 text-red-700 hover:bg-red-50',
        success: 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
        link: 'text-zinc-700 underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        default: 'h-10 px-4',
        sm: 'h-9 px-3',
        lg: 'h-11 px-5',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : 'button';
  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
export type { ButtonProps };
