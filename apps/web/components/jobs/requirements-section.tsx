'use client';

import { useState } from 'react';

interface RequirementsSectionProps {
  skills: string[];
  certifications?: string[];
}

const VISIBLE_COUNT = 5;

export function RequirementsSection({ skills, certifications = [] }: RequirementsSectionProps) {
  const [expandedSkills, setExpandedSkills] = useState(false);
  const [expandedCerts, setExpandedCerts] = useState(false);

  function renderList(items: string[], expanded: boolean, setExpanded: (val: boolean) => void) {
    const hasMore = items.length > VISIBLE_COUNT;
    const visibleItems = expanded ? items : items.slice(0, VISIBLE_COUNT);
    const hiddenCount = items.length - VISIBLE_COUNT;

    return (
      <>
        <ul className="space-y-3 text-slate-600 dark:text-slate-400 mt-4">
          {visibleItems.map((item: string) => {
            const match = item.match(/(.*?)\s*\((Bắt buộc|Ưu tiên)\)$/i);
            const text = match ? match[1] : item;
            const tag = match ? match[2] : null;

            return (
              <li key={item} className="flex items-center gap-3 text-sm">
                <span className="shrink-0 size-5 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary" style={{ fontSize: '13px' }}>
                    check
                  </span>
                </span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{text}</span>
                {tag && (
                  <span className={`px-2 py-0.5 text-[10px] uppercase tracking-wide font-bold rounded-md ${tag.toLowerCase() === 'bắt buộc' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                    {tag}
                  </span>
                )}
              </li>
            );
          })}
        </ul>

        {hasMore && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors group"
          >
            <span className="material-symbols-outlined text-base transition-transform duration-200 group-hover:scale-110">
              {expanded ? 'expand_less' : 'expand_more'}
            </span>
            {expanded ? 'Show less' : `View ${hiddenCount} more`}
          </button>
        )}
      </>
    );
  }

  return (
    <div className="space-y-8">
      {skills.length > 0 && (
        <section id="requirements-skills">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">verified_user</span>
            Skills Requirements
          </h3>
          {renderList(skills, expandedSkills, setExpandedSkills)}
        </section>
      )}

      {certifications.length > 0 && (
        <section id="requirements-certs">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">workspace_premium</span>
            Certifications
          </h3>
          {renderList(certifications, expandedCerts, setExpandedCerts)}
        </section>
      )}
    </div>
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
