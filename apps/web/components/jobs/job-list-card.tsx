'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import type { JobItem } from '@/lib/jobs-client';

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
  const experienceText = job.employmentType || 'Full-time';

  return (
    <div className="job-list-card group rounded-xl border border-gray-200 bg-white p-4 md:p-5">
      <div className="flex gap-4">
        {/* Company Logo */}
        <Link
          href={`/jobs/${job.slug}`}
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-gray-100 bg-gray-50 p-2 transition-all group-hover:border-primary-200 md:h-20 md:w-20"
        >
          {job.companyLogoUrl ? (
            <Image
              src={job.companyLogoUrl}
              alt={job.companyName ?? 'Company'}
              width={56}
              height={56}
              className="h-12 w-12 object-contain md:h-14 md:w-14"
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
              <Link href={`/jobs/${job.slug}`}>
                <h3 className="mb-1 truncate text-base font-bold text-slate-900 transition-colors group-hover:text-primary-600 md:text-lg">
                  {job.title}
                </h3>
              </Link>
              <p className="mb-2 truncate text-sm text-gray-500">
                {job.companyName ?? 'Confidential Company'}
              </p>
            </div>
            {/* Salary */}
            <div className="shrink-0 text-right">
              <span className="text-base font-bold text-green-600 md:text-lg">
                {salaryText}
              </span>
            </div>
          </div>

          {/* Location & Experience */}
          <div className="mb-3 flex flex-wrap items-center gap-3 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <i className="fa-solid fa-location-dot text-xs text-gray-400" />
              {locationLabel}
            </span>
            {job.location && typeof job.location === 'object' && (
              <span className="flex items-center gap-1">
                <i className="fa-solid fa-building text-xs text-gray-400" />
                {experienceText}
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
              <span className="hidden text-xs text-gray-400 sm:inline">
                Đăng {timeAgo}
              </span>
              <button
                className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-400 transition-all hover:border-red-200 hover:text-red-500"
                type="button"
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
    </div>
  );
}
