'use client';

import Link from 'next/link';
import { Bookmark, MapPin, Briefcase } from 'lucide-react';
import type { MatchTier } from '@/lib/recommendation-client';
import { cn } from '@/lib/cn';

type RecommendedJob = {
  id: string;
  title: string;
  companyName: string;
  location: string;
  matchScore: number;
  matchTier: MatchTier;
  skills: string[];
  salary?: string;
};

type RecommendedJobsSectionProps = {
  jobs: RecommendedJob[];
};

const TIER_STYLES: Record<MatchTier, { label: string; badge: string }> = {
  excellent: {
    label: 'Phù hợp tốt',
    badge: 'bg-green-100 text-green-800',
  },
  good: {
    label: 'Khá phù hợp',
    badge: 'bg-blue-100 text-blue-800',
  },
  potential: {
    label: 'Tiềm năng',
    badge: 'bg-amber-100 text-amber-800',
  },
  low: {
    label: 'Phù hợp thấp',
    badge: 'bg-gray-100 text-gray-600',
  },
};

function getInitial(name: string) {
  return name.charAt(0).toUpperCase();
}

export function RecommendedJobsSection({
  jobs,
}: RecommendedJobsSectionProps) {
  if (jobs.length === 0) {
    return (
      <div className="rounded-xl border border-md-outline-variant/30 bg-md-surface-container-lowest p-8 text-center shadow-sm">
        <Briefcase className="mx-auto mb-3 h-10 w-10 text-md-on-surface-variant opacity-40" />
        <p className="font-body-md text-md-on-surface mb-3">
          Chưa có việc làm được đề xuất.
        </p>
        <Link
          href="/dashboard/candidate/recommendations"
          className="inline-flex items-center rounded-lg bg-md-primary px-4 py-2 font-label-md text-md-on-primary hover:opacity-90"
        >
          Bắt đầu Smart Job Match
        </Link>
      </div>
    );
  }

  return (
    <section>
      <h2 className="font-headline-md text-md-on-surface mb-4">
        Việc làm được đề xuất
      </h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {jobs.map((job) => {
          const tier = TIER_STYLES[job.matchTier];
          return (
            <div
              key={job.id}
              className="group relative flex flex-col rounded-xl border border-md-outline-variant/30 bg-md-surface-container-lowest p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              {/* Top row: avatar + bookmark */}
              <div className="mb-3 flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-md-primary-container font-label-md text-md-on-primary">
                  {getInitial(job.companyName)}
                </div>
                <button
                  type="button"
                  aria-label="Lưu việc làm"
                  className="rounded-lg p-1.5 text-md-on-surface-variant transition-colors hover:bg-md-surface-container"
                >
                  <Bookmark className="h-5 w-5" />
                </button>
              </div>

              {/* Match badge */}
              <span
                className={cn(
                  'mb-2 inline-flex w-fit items-center rounded-full px-2.5 py-0.5 font-label-sm',
                  tier.badge,
                )}
              >
                {tier.label}
              </span>

              {/* Title & company */}
              <h3 className="font-body-md text-md-on-surface mb-1 line-clamp-2">
                {job.title}
              </h3>
              <p className="font-body-sm text-md-on-surface-variant mb-1">
                {job.companyName}
              </p>

              {/* Location */}
              <div className="mb-3 flex items-center gap-1 text-md-on-surface-variant">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="font-body-sm truncate">{job.location}</span>
              </div>

              {/* Skills */}
              {job.skills.length > 0 ? (
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {job.skills.slice(0, 4).map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center rounded bg-md-surface-container px-2 py-0.5 font-label-sm text-md-on-surface-variant"
                    >
                      {skill}
                    </span>
                  ))}
                  {job.skills.length > 4 ? (
                    <span className="font-label-sm text-md-outline-variant">
                      +{job.skills.length - 4}
                    </span>
                  ) : null}
                </div>
              ) : null}

              {/* Salary + apply */}
              <div className="mt-auto flex items-center justify-between pt-2">
                <span className="font-body-sm text-md-on-surface-variant">
                  {job.salary ?? 'Thương lương thảo luận'}
                </span>
                <Link
                  href={`/jobs/${job.id}`}
                  className="inline-flex items-center rounded-lg bg-md-primary px-3 py-1.5 font-label-sm text-md-on-primary hover:opacity-90"
                >
                  Ứng tuyển
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
