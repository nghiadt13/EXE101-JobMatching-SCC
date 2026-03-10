import Link from 'next/link';
import { type JobItem } from '@/lib/jobs-client';
import { Button } from '@/components/ui/button';
import { JobListingCard } from './job-listing-card';

type HomeFeaturedJobsProps = {
  jobs: JobItem[];
};

export function HomeFeaturedJobs({ jobs }: HomeFeaturedJobsProps) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">Featured jobs</h2>
          <p className="mt-1 text-sm text-zinc-600">Latest openings from active recruiters.</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/jobs">View all jobs</Link>
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {jobs.slice(0, 6).map((job) => (
          <JobListingCard key={job.id} job={job} compact />
        ))}
      </div>
    </section>
  );
}
