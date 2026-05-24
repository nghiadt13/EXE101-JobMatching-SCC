import { cn } from '@/lib/cn';

type Activity = {
  text: string;
  timeAgo: string;
  isPrimary?: boolean;
};

type RecentActivityCardProps = {
  activities: Activity[];
};

export function RecentActivityCard({ activities }: RecentActivityCardProps) {
  return (
    <div className="rounded-xl border border-md-outline-variant/30 bg-md-surface-container-lowest p-5 shadow-sm">
      <h3 className="font-headline-md text-md-on-surface mb-4">
        Hoạt động gần đây
      </h3>

      {activities.length === 0 ? (
        <p className="font-body-sm text-md-on-surface-variant">
          Chưa có hoạt động nào.
        </p>
      ) : (
        <ul className="relative space-y-4 pl-4">
          {/* Timeline line */}
          <div className="absolute left-[5px] top-1 h-[calc(100%-8px)] w-px bg-md-outline-variant" />

          {activities.map((activity, i) => (
            <li key={i} className="relative flex items-start gap-3">
              {/* Dot */}
              <div
                className={cn(
                  'absolute -left-4 top-1.5 h-2.5 w-2.5 rounded-full ring-2 ring-md-surface-container-lowest',
                  activity.isPrimary
                    ? 'bg-md-primary'
                    : 'bg-md-outline-variant',
                )}
              />

              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    'font-body-sm',
                    activity.isPrimary
                      ? 'text-md-on-surface font-medium'
                      : 'text-md-on-surface-variant',
                  )}
                >
                  {activity.text}
                </p>
                <p className="font-label-sm text-md-outline-variant mt-0.5">
                  {activity.timeAgo}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
