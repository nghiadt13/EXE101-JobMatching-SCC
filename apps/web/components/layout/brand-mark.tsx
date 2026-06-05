import Image from 'next/image';
import { cn } from '@/lib/cn';

type SCCBrandIconProps = {
  className?: string;
};

type SCCBrandLogoProps = {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
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
        src="/logo.png"
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
}: SCCBrandLogoProps) {
  return (
    <span className={cn('flex items-center', className)}>
      <SCCBrandIcon className={cn('h-12 w-32 sm:h-14 sm:w-40', iconClassName)} />
    </span>
  );
}
