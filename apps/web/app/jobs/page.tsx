import Link from 'next/link';
import { getJobs } from '@/lib/jobs-client';

export default async function JobsPage() {
  const jobs = await getJobs({ page: 1, limit: 30 });

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-12">
      <header className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.15em] text-zinc-500">Jobs</p>
        <h1 className="mt-1 text-3xl font-semibold text-zinc-900">Open Positions</h1>
      </header>

      <section className="grid gap-4">
        {jobs.items.map((job) => (
          <article key={job.id} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <Link href={`/jobs/${job.slug}`} className="text-lg font-semibold text-zinc-900 underline">
                  {job.title}
                </Link>
                <p className="mt-1 text-sm text-zinc-500">{job.employmentType}</p>
              </div>
              <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700">
                {job.status}
              </span>
            </div>
            <p className="mt-3 line-clamp-3 text-sm text-zinc-700">{job.description}</p>
          </article>
        ))}
        {!jobs.items.length ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 p-6 text-sm text-zinc-600">
            No published jobs yet.
          </div>
        ) : null}
      </section>
    </main>
  );
}
