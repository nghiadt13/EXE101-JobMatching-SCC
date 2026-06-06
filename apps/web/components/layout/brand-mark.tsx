import Image from 'next/image';
import { cn } from '@/lib/cn';

type SCCBrandIconProps = {
  className?: string;
};

type SCCBrandLogoProps = {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  showText?: boolean;
};

export function SCCBrandIcon({ className }: SCCBrandIconProps) {
  return (
    <span
      className={cn(
        'relative inline-flex items-center justify-center overflow-hidden',
        className,
      )}
      aria-hidden="true"
    >
      <Image
        src="/logo.jpg"
        alt="SCC Logo"
        fill
        className="object-contain"
        sizes="64px"
        priority
      />
    </span>
  );
}

export function SCCBrandLogo({
  className,
  iconClassName,
  textClassName,
  showText = true,
}: SCCBrandLogoProps) {
  return (
    <span className={cn('flex items-center gap-1', className)}>
      <SCCBrandIcon className={cn('h-20 w-20', iconClassName)} />
      {showText && (
        <span
          className={cn(
            'text-2xl font-bold tracking-tight text-slate-800',
            textClassName,
          )}
        >
          SCC
        </span>
      )}
    </span>
  );
}
