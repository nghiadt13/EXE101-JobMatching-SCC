import Link from 'next/link';
import { getJobs } from '@/lib/jobs-client';

export default async function JobsPage() {
  const jobs = await getJobs({ page: 1, limit: 30 });

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-12">
      <header className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.15em] text-zinc-500">Jobs</p>
        <h1 className="mt-1 text-3xl font-semibold text-zinc-900">Open Positions</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Browse published jobs, open details, then submit your application from the detail page.
        </p>
      </header>

      <section className="grid gap-4">
        {jobs.items.map((job) => (
          <article key={job.id} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <Link href={`/jobs/${job.slug}`} className="text-lg font-semibold text-zinc-900 hover:underline">
                  {job.title}
                </Link>
                <p className="mt-1 text-sm text-zinc-500">{job.employmentType}</p>
              </div>
              <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700">
                {job.status}
              </span>
            </div>
            <p className="mt-3 line-clamp-3 text-sm text-zinc-700">{job.description}</p>
            <div className="mt-4">
              <Link
                href={`/jobs/${job.slug}`}
                className="inline-flex h-9 items-center justify-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-700"
              >
                View details and apply
              </Link>
            </div>
          </article>
        ))}
        {!jobs.items.length ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 p-6 text-sm text-zinc-600">
            No published jobs yet. Please check back later.
          </div>
        ) : null}
      </section>
    </main>
  );
}
