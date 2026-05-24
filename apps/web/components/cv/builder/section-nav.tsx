'use client';

import {
  useCallback,
  useEffect,
  useState,
  type RefObject,
} from 'react';
import {
  User,
  Briefcase,
  GraduationCap,
  Sparkles,
  FolderGit2,
  Award,
  Languages,
  type LucideIcon,
} from 'lucide-react';

import { cn } from '@/lib/cn';

/**
 * Identifier for one of the seven canonical CV sections.
 *
 * The set is closed: every canvas template renders exactly one element with
 * `id="cv-section-${SectionId}"` per section, so {@link SectionNav} mirrors
 * the same 7-element vocabulary (Requirement 3.1).
 */
export type SectionId =
  | 'profile'
  | 'experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'certifications'
  | 'languages';

/**
 * One row in the navigation list.
 */
interface SectionEntry {
  id: SectionId;
  /** Vietnamese label rendered in the nav (per the workspace design). */
  label: string;
  /** Lucide icon component rendered to the left of the label. */
  icon: LucideIcon;
}

/**
 * The seven sections rendered in the navigation panel, in canonical order.
 *
 * The `id` strings double as the suffix of the canvas anchor ids
 * (`cv-section-${id}`), so this list is the single source of truth for both
 * scroll targets and the IntersectionObserver target nodes (Requirement 3.1).
 */
const SECTION_ENTRIES: ReadonlyArray<SectionEntry> = [
  { id: 'profile', label: 'Thông tin', icon: User },
  { id: 'experience', label: 'Kinh nghiệm', icon: Briefcase },
  { id: 'education', label: 'Học vấn', icon: GraduationCap },
  { id: 'skills', label: 'Kỹ năng', icon: Sparkles },
  { id: 'projects', label: 'Dự án', icon: FolderGit2 },
  { id: 'certifications', label: 'Chứng chỉ', icon: Award },
  { id: 'languages', label: 'Ngôn ngữ', icon: Languages },
];

/**
 * Build the DOM id for a given section. Centralised so the constant prefix
 * stays in lockstep with the templates that mark the matching elements.
 */
function anchorIdFor(id: SectionId): string {
  return `cv-section-${id}`;
}

/**
 * Look up the anchor element for a section, scoped to the optional canvas
 * container when provided, falling back to a document-wide lookup otherwise.
 */
function findAnchor(
  id: SectionId,
  scope: HTMLElement | null,
): HTMLElement | null {
  const selector = `#${CSS.escape(anchorIdFor(id))}`;
  if (scope) {
    return scope.querySelector<HTMLElement>(selector);
  }
  return document.querySelector<HTMLElement>(selector);
}

/**
 * Props for {@link SectionNav}.
 */
export interface SectionNavProps {
  /**
   * Optional ref to the scrollable canvas container. When provided, the
   * `IntersectionObserver` uses this element as its `root` so visibility is
   * measured inside the canvas, and section anchors are resolved within
   * that subtree. When omitted, the component falls back to the document
   * (viewport) and `document.getElementById` lookups.
   */
  scrollContainerRef?: RefObject<HTMLElement | null>;
  /**
   * Optional callback fired whenever a section button is clicked, after the
   * scroll has been initiated. Useful when the parent wants to react to
   * navigation events (e.g. analytics, closing a mobile drawer).
   */
  onSelectSection?: (id: SectionId) => void;
  /** Extra class names applied to the outer `<aside>` wrapper. */
  className?: string;
}

/**
 * Left-hand workspace panel that lets the candidate jump between the seven
 * CV sections without manually scrolling the canvas.
 *
 * Behaviour:
 * - Renders exactly 7 buttons with Vietnamese labels and Lucide icons,
 *   matching the section vocabulary used by the canvas templates
 *   (Requirement 3.1).
 * - On click, resolves the matching anchor (inside `scrollContainerRef`
 *   when provided, otherwise via the document) and calls
 *   `scrollIntoView({ behavior: 'smooth', block: 'center' })` so the
 *   target section is centred inside the viewport (Requirement 3.2).
 * - Uses a single `IntersectionObserver` to track which section currently
 *   owns the most of the (canvas or document) viewport, and highlights the
 *   corresponding nav row as the active section (Requirement 3.4).
 */
export function SectionNav({
  scrollContainerRef,
  onSelectSection,
  className,
}: SectionNavProps) {
  // The currently most-visible section, derived from IntersectionObserver
  // entries below. `null` while the observer is still warming up.
  const [activeSection, setActiveSection] = useState<SectionId | null>(null);

  /**
   * Scroll to the requested section. Resolves the anchor inside the canvas
   * container when one is supplied so we never grab a stray element with a
   * matching id from elsewhere on the page (e.g. a hidden printable
   * preview). Falls back to a document-wide lookup when no container ref
   * is provided.
   */
  const handleSelect = useCallback(
    (id: SectionId) => {
      const anchor = findAnchor(id, scrollContainerRef?.current ?? null);

      if (anchor) {
        anchor.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Optimistic highlight: set the clicked entry as active so the UI
        // feels responsive even before IntersectionObserver fires.
        setActiveSection(id);
      }

      onSelectSection?.(id);
    },
    [scrollContainerRef, onSelectSection],
  );

  /**
   * Set up an `IntersectionObserver` to keep `activeSection` in sync with
   * the section currently dominating the viewport (canvas or document).
   *
   * Strategy:
   * - Observer root is the canvas container when provided, otherwise
   *   `null` (the document viewport).
   * - Threshold list spans 0 → 1 in 0.1 increments so we get continuous
   *   updates on the intersection ratio.
   * - On every callback we pick the entry with the largest
   *   `intersectionRatio` and promote it to `activeSection`. Ties resolve
   *   in declaration order (top-to-bottom) so when two sections are
   *   equally visible the one nearest the start of the CV wins.
   */
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;

    const root = scrollContainerRef?.current ?? null;

    // Resolve every anchor up-front. Sections that are not yet rendered
    // (e.g. the user just switched templates and React has not painted)
    // will simply be missing from the list; the observer recovers on the
    // next mount cycle of this component.
    const targets: Array<{ id: SectionId; el: HTMLElement }> = [];
    for (const entry of SECTION_ENTRIES) {
      const el = findAnchor(entry.id, root);
      if (el) {
        targets.push({ id: entry.id, el });
      }
    }
    if (targets.length === 0) return;

    // Snapshot of the latest intersection ratios per section. We keep this
    // outside React state so the observer callback can run at scroll
    // frequency without triggering re-renders for every incremental change;
    // we only call `setActiveSection` when the *winner* changes.
    const ratios = new Map<SectionId, number>();

    const idLookup = new Map<HTMLElement, SectionId>(
      targets.map((t) => [t.el, t.id]),
    );

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = idLookup.get(entry.target as HTMLElement);
          if (!id) continue;
          ratios.set(id, entry.intersectionRatio);
        }

        // Pick the section with the largest visible ratio. Walking in
        // declaration order means ties break toward the first section.
        let bestId: SectionId | null = null;
        let bestRatio = 0;
        for (const entry of SECTION_ENTRIES) {
          const ratio = ratios.get(entry.id) ?? 0;
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestId = entry.id;
          }
        }

        // Only update state when the winner actually changes — keeps the
        // re-render cost flat regardless of scroll speed.
        if (bestId !== null) {
          setActiveSection((prev) => (prev === bestId ? prev : bestId));
        }
      },
      {
        root,
        // Spread thresholds so the ratio is reported continuously instead
        // of just at the entry/exit boundaries.
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
      },
    );

    for (const target of targets) {
      observer.observe(target.el);
    }

    return () => observer.disconnect();
  }, [scrollContainerRef]);

  return (
    <aside
      // 240px panel width per the workspace layout (Requirement 9.1).
      className={cn(
        'flex h-full w-[240px] flex-col gap-1 overflow-y-auto border-r border-zinc-200 bg-white p-4',
        className,
      )}
      aria-label="Điều hướng phần CV"
      data-testid="section-nav"
    >
      <h3 className="mb-2 px-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
        Phần CV
      </h3>
      <nav>
        <ul className="flex flex-col gap-1">
          {SECTION_ENTRIES.map((entry) => {
            const Icon = entry.icon;
            const isActive = activeSection === entry.id;
            return (
              <li key={entry.id}>
                <button
                  type="button"
                  onClick={() => handleSelect(entry.id)}
                  // `aria-current="location"` flags the entry that points
                  // at the section currently in view, mirroring the visual
                  // highlight for assistive tech.
                  aria-current={isActive ? 'location' : undefined}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors',
                    'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1',
                    isActive
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900',
                  )}
                  data-testid={`section-nav-item-${entry.id}`}
                  data-active={isActive ? 'true' : 'false'}
                >
                  <Icon
                    className={cn(
                      'h-4 w-4 shrink-0',
                      isActive ? 'text-indigo-600' : 'text-zinc-400',
                    )}
                    aria-hidden
                  />
                  <span>{entry.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
