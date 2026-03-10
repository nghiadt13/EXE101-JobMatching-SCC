const STEPS = [
  {
    title: 'Create your profile',
    description: 'Register as a candidate and complete your basic information.',
  },
  {
    title: 'Upload your CV',
    description: 'Use your latest CV to prepare for faster applications.',
  },
  {
    title: 'Apply and track',
    description: 'Apply to matching jobs and monitor status from your dashboard.',
  },
];

export function HomeHowItWorks() {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-zinc-900">How it works</h2>
      <p className="mt-1 text-sm text-zinc-600">Simple flow built for fast job discovery and application.</p>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {STEPS.map((step, index) => (
          <article key={step.title} className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-zinc-500">Step {index + 1}</p>
            <h3 className="mt-1 text-base font-semibold text-zinc-900">{step.title}</h3>
            <p className="mt-2 text-sm text-zinc-600">{step.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
