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
        'relative inline-flex items-center justify-center rounded-lg bg-primary-600 text-white',
        className,
      )}
      aria-hidden="true"
    >
      <i className="fa-solid fa-hand-holding absolute bottom-[18%] left-[16%] text-[42%] opacity-95" />
      <i className="fa-solid fa-briefcase absolute top-[20%] right-[16%] text-[44%]" />
    </span>
  );
}

export function SCCBrandLogo({
  className,
  iconClassName,
  textClassName,
}: SCCBrandLogoProps) {
  return (
    <span className={cn('flex items-center gap-2', className)}>
      <SCCBrandIcon className={cn('h-10 w-10', iconClassName)} />
      <span className={cn('text-2xl font-bold tracking-tight text-slate-800', textClassName)}>
        SCC
      </span>
    </span>
  );
}
