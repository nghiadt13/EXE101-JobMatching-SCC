import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { type JobItem } from '@/lib/jobs-client';

type JobListingCardProps = {
  job: JobItem;
  compact?: boolean;
};

export function JobListingCard({ job, compact = false }: JobListingCardProps) {
  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-colors hover:border-zinc-300">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href={`/jobs/${job.slug}`} className="text-lg font-semibold text-zinc-900 hover:underline">
            {job.title}
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="outline">{job.employmentType}</Badge>
            <Badge>{job.status}</Badge>
          </div>
        </div>
      </div>
      {!compact ? (
        <p className="mt-3 line-clamp-3 text-sm text-zinc-700">{job.description}</p>
      ) : null}
      <div className="mt-4">
        <Button asChild size="sm">
          <Link href={`/jobs/${job.slug}`}>View details and apply</Link>
        </Button>
      </div>
    </article>
  );
}
