import Link from 'next/link';
import { getJobs } from '@/lib/jobs-client';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';

export default async function JobsPage() {
  const jobs = await getJobs({ page: 1, limit: 30 });

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-12">
      <PageHeader
        overline="Jobs"
        title="Open Positions"
        description="Browse published jobs, open details, then submit your application from the detail page."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/login">Sign in</Link>
          </Button>
        }
      />

      <section className="grid gap-4">
        {jobs.items.map((job) => (
          <article key={job.id} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-colors hover:border-zinc-300">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <Link href={`/jobs/${job.slug}`} className="text-lg font-semibold text-zinc-900 hover:underline">
                  {job.title}
                </Link>
                <p className="mt-1 text-sm text-zinc-500">{job.employmentType}</p>
              </div>
              <Badge>{job.status}</Badge>
            </div>
            <p className="mt-3 line-clamp-3 text-sm text-zinc-700">{job.description}</p>
            <div className="mt-4">
              <Button asChild size="sm">
                <Link href={`/jobs/${job.slug}`}>View details and apply</Link>
              </Button>
            </div>
          </article>
        ))}
        {!jobs.items.length ? (
          <EmptyState
            title="No published jobs yet"
            description="Please check back later for new opportunities."
          />
        ) : null}
      </section>
    </main>
  );
}
