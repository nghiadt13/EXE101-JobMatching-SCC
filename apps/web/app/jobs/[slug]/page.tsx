import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ApiError } from '@/lib/api-client';
import { getJobDetail } from '@/lib/jobs-client';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function JobDetailPage({ params }: PageProps) {
  const { slug } = await params;

  let job;
  try {
    job = await getJobDetail(slug);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-6 py-12">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-zinc-500">Job</p>
          <h1 className="mt-1 text-3xl font-semibold text-zinc-900">{job.title}</h1>
          <p className="mt-2 text-sm text-zinc-500">{job.employmentType}</p>
        </div>
        <Link href="/jobs" className="text-sm font-medium text-zinc-700 underline">
          Back jobs
        </Link>
      </header>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="whitespace-pre-wrap text-zinc-800">{job.description}</p>
        {!!job.skills.length && (
          <div className="mt-4 flex flex-wrap gap-2">
            {job.skills.map((skill) => (
              <span key={skill} className="rounded-full bg-zinc-100 px-2 py-1 text-xs text-zinc-700">
                {skill}
              </span>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
