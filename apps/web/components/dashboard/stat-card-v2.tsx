import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type StatCardBadge = {
  text: string;
  variant: 'primary' | 'warning' | 'success';
};

type StatCardTrend = {
  text: string;
  direction: 'up' | 'down';
};

type StatCardV2Props = {
  label: string;
  value: number | string;
  icon: ReactNode;
  iconBg?: string;
  iconColor?: string;
  decorativeIconColor?: string;
  subtitle?: string;
  trend?: StatCardTrend;
  badge?: StatCardBadge;
};

export function StatCardV2({
  label,
  value,
  icon,
  iconBg = 'bg-primary/10',
  iconColor = 'text-primary',
  decorativeIconColor = 'text-primary/5',
  subtitle,
  trend,
  badge,
}: StatCardV2Props) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-md shadow-sm transition-all duration-300 hover:shadow-md">
      {/* Decorative background icon */}
      <div className={cn('pointer-events-none absolute -right-4 -bottom-4 select-none transition-transform group-hover:scale-110 duration-500', decorativeIconColor)}>
        <span className="material-symbols-outlined text-[100px]">{/* Icon rendered via parent */}</span>
      </div>

      <div className="relative z-10 flex items-center gap-md">
        <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl', iconBg, iconColor)}>
          {icon}
        </div>
        <div>
          <p className="font-label-sm text-label-sm text-on-surface-variant">{label}</p>
          <div className="mt-1 flex items-center gap-sm">
            <span className="font-headline-md text-headline-md text-on-surface">{value}</span>
            {trend ? (
              <span className={cn(
                'inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[11px] font-semibold',
                trend.direction === 'up'
                  ? 'text-green-600 bg-green-50 border-green-200/30'
                  : 'text-red-600 bg-red-50 border-red-200/30',
              )}>
                <span className="material-symbols-outlined text-[14px] mr-0.5">trending_up</span>
                {trend.text}
              </span>
            ) : null}
            {badge ? (
              <span className={cn(
                'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold border',
                badge.variant === 'warning' && 'text-amber-600 bg-amber-50 border-amber-200/30',
                badge.variant === 'primary' && 'text-primary bg-primary-container/10 border-primary/20',
                badge.variant === 'success' && 'text-green-600 bg-green-50 border-green-200/30',
              )}>
                {badge.text}
              </span>
            ) : null}
          </div>
          {subtitle ? (
            <p className="mt-1 text-[11px] text-on-surface-variant/70">{subtitle}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
