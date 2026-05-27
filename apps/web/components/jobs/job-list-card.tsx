'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import type { JobItem } from '@/lib/jobs-client';
import { EXPERIENCE_LEVEL_LABELS, type ExperienceLevel } from '@/lib/job-filter-options';

type JobListCardProps = {
  job: JobItem;
  salaryText: string;
  locationLabel: string;
  timeAgo: string;
};

function normalizeIconClass(iconKey: string | null | undefined): string {
  if (!iconKey || iconKey.trim().length === 0) {
    return 'fa-solid fa-building';
  }
  if (
    iconKey.includes('fa-solid') ||
    iconKey.includes('fa-regular') ||
    iconKey.includes('fa-brands')
  ) {
    return iconKey;
  }
  return iconKey.startsWith('fa-')
    ? `fa-solid ${iconKey}`
    : `fa-solid fa-${iconKey}`;
}

export function JobListCard({
  job,
  salaryText,
  locationLabel,
  timeAgo,
}: JobListCardProps) {
  const [isSaved, setIsSaved] = useState(false);

  const skills = job.skills?.slice(0, 5) ?? [];
  const experienceLabel = job.experienceLevel
    ? EXPERIENCE_LEVEL_LABELS[job.experienceLevel as ExperienceLevel] ?? null
    : null;

  return (
    <article className="job-list-card group rounded-xl border border-primary-200 bg-white p-3 transition-all hover:border-primary-400 hover:bg-primary-50/40 md:p-4">
      <div className="flex gap-4">
        {/* Company Logo */}
        <Link
          href={`/jobs/${job.slug}`}
          className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white p-2 transition-all group-hover:border-primary-200 md:h-24 md:w-24"
        >
          {job.companyLogoUrl ? (
            <Image
              src={job.companyLogoUrl}
              alt={job.companyName ?? 'Company'}
              width={64}
              height={64}
              className="h-14 w-14 object-contain md:h-16 md:w-16"
              unoptimized
            />
          ) : (
            <i
              className={`${normalizeIconClass(job.companyIconKey)} text-3xl text-slate-400`}
            />
          )}
        </Link>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2">
                <Link href={`/jobs/${job.slug}`}>
                  <h3 className="line-clamp-2 text-base font-bold leading-snug text-slate-800 transition-colors group-hover:text-primary-700">
                    {job.title}
                  </h3>
                </Link>
                {job.companyType === 'pro' && (
                  <span className="shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                    Pro
                  </span>
                )}
              </div>
              <p className="mb-2 truncate text-sm font-semibold text-slate-500">
                {job.companyName ?? 'Confidential Company'}
              </p>
            </div>
            {/* Salary */}
            <div className="shrink-0 text-right">
              <span className="text-sm font-bold text-primary-600 md:text-base">
                {salaryText}
              </span>
            </div>
          </div>

          {/* Location & Experience & Employment type */}
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="rounded-md bg-white/80 px-2 py-1">
              {locationLabel}
            </span>
            {experienceLabel && (
              <span className="rounded-md bg-white/80 px-2 py-1">
                {experienceLabel}
              </span>
            )}
            {job.employmentType && (
              <span className="rounded-md bg-white/80 px-2 py-1">
                {job.employmentType}
              </span>
            )}
          </div>

          {/* Tags (skills) */}
          <div className="flex flex-wrap items-center gap-2">
            {skills.map((skill) => (
              <span
                key={skill}
                className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600"
              >
                {skill}
              </span>
            ))}
            {job.skills && job.skills.length > 5 && (
              <span className="text-xs text-gray-400">
                +{job.skills.length - 5}
              </span>
            )}

            {/* Time ago & Save button */}
            <div className="ml-auto flex items-center gap-3">
              <span className="hidden text-xs text-slate-400 sm:inline">
                Đăng {timeAgo}
              </span>
              <button
                className="flex h-8 w-8 items-center justify-center rounded-full border border-primary-200 bg-white text-primary-500 transition-all hover:border-primary-500 hover:text-primary-700"
                type="button"
                aria-label={isSaved ? 'Bỏ lưu việc làm' : 'Lưu việc làm'}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsSaved(!isSaved);
                }}
              >
                <i
                  className={`${isSaved ? 'fa-solid text-red-500' : 'fa-regular'} fa-heart text-sm`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
