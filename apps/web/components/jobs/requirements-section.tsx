'use client';

import { useState } from 'react';

interface RequirementsSectionProps {
  skills: string[];
}

const VISIBLE_COUNT = 5;

export function RequirementsSection({ skills }: RequirementsSectionProps) {
  const [expanded, setExpanded] = useState(false);

  const hasMore = skills.length > VISIBLE_COUNT;
  const visibleSkills = expanded ? skills : skills.slice(0, VISIBLE_COUNT);
  const hiddenCount = skills.length - VISIBLE_COUNT;

  return (
    <section id="requirements">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">verified_user</span>
        Requirements
      </h3>

      <ul className="space-y-2 text-slate-600 dark:text-slate-400">
        {visibleSkills.map((skill: string) => (
          <li
            key={skill}
            className="flex items-start gap-2 text-sm leading-relaxed"
          >
            <span className="mt-0.5 shrink-0 size-5 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary" style={{ fontSize: '13px' }}>
                check
              </span>
            </span>
            <span>Proficiency in <strong>{skill}</strong>.</span>
          </li>
        ))}
      </ul>

      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors group"
        >
          <span className="material-symbols-outlined text-base transition-transform duration-200 group-hover:scale-110">
            {expanded ? 'expand_less' : 'expand_more'}
          </span>
          {expanded
            ? 'Show less'
            : `View ${hiddenCount} more requirement${hiddenCount !== 1 ? 's' : ''}`}
        </button>
      )}
    </section>
  );
}

interface RequirementsFallbackSectionProps {
  items?: string[];
}

export function RequirementsFallbackSection({ items }: RequirementsFallbackSectionProps) {
  const defaultItems = items ?? [
    'Relevant professional experience in the role.',
    'Strong communication and collaboration skills.',
    'Proficiency in Git and agile development methodologies.',
  ];

  const [expanded, setExpanded] = useState(false);
  const hasMore = defaultItems.length > VISIBLE_COUNT;
  const visibleItems = expanded ? defaultItems : defaultItems.slice(0, VISIBLE_COUNT);
  const hiddenCount = defaultItems.length - VISIBLE_COUNT;

  return (
    <section id="requirements">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">verified_user</span>
        Requirements
      </h3>

      <ul className="space-y-2 text-slate-600 dark:text-slate-400">
        {visibleItems.map((item, i) => (
          <li
            key={i}
            className="flex items-start gap-2 text-sm leading-relaxed"
          >
            <span className="mt-0.5 shrink-0 size-5 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary" style={{ fontSize: '13px' }}>
                check
              </span>
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>

      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors group"
        >
          <span className="material-symbols-outlined text-base transition-transform duration-200 group-hover:scale-110">
            {expanded ? 'expand_less' : 'expand_more'}
          </span>
          {expanded
            ? 'Show less'
            : `View ${hiddenCount} more requirement${hiddenCount !== 1 ? 's' : ''}`}
        </button>
      )}
    </section>
  );
}
