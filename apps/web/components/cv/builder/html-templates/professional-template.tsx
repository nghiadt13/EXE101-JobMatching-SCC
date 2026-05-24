'use client';

import { memo } from 'react';

import type {
  CvBuilderData,
  CvEducation,
  CvExperience,
  CvProfile,
  CvProject,
} from '@/types/cv-builder';

import { BlockOverlay } from '../block-overlay';
import { InlineEditableText } from '../inline-editable-text';
import {
  deleteSectionItem,
  reorderSection,
  type ReorderableSectionKey,
} from '../section-helpers';

/**
 * Props for {@link ProfessionalTemplate}.
 *
 * Mirrors the shared `CvTemplateProps` contract used by every HTML template
 * variant: a single source of truth (`data`) flows down from `CvBuilderPage`,
 * and any mutation bubbles up via `onChange` so the parent owns the state.
 */
export interface ProfessionalTemplateProps {
  data: CvBuilderData;
  onChange: (updated: CvBuilderData) => void;
}

/**
 * `ProfessionalTemplate` renders the CV as a two-column layout inspired by
 * polished agency / consulting resumes:
 *
 * ```
 * ┌──────────────────────────────────────────────────────────────┐
 * │  ████ Header banner (var(--cv-primary-color))               │  ← #cv-section-profile
 * │       NAME · summary (optional tagline)                     │
 * ├───────────────────────────┬──────────────────────────────────┤
 * │  35% sidebar (bg-slate-50)│  65% main column                 │
 * │  • Contact info           │  • Experience  ← #cv-section-…   │
 * │  • Skills      ←  anchor  │  • Education   ← #cv-section-…   │
 * │  • Languages   ←  anchor  │  • Projects    ← #cv-section-…   │
 * │  • Certifications ← anchor│                                  │
 * └───────────────────────────┴──────────────────────────────────┘
 * ```
 *
 * Behaviour highlights:
 * - Every text node is rendered through {@link InlineEditableText} so editing
 *   stays inline and uniform across templates (Requirement 8.4).
 * - Repeating entries (experience / education / projects / skills / languages
 *   / certifications) are wrapped in {@link BlockOverlay} which surfaces the
 *   ↑ / ↓ / ✕ toolbar on hover (Requirement 8.5).
 * - Accent color text uses the Tailwind arbitrary value
 *   `text-[var(--cv-primary-color)]` so design tokens flow through CSS
 *   variables instead of hard-coded colors (Requirement 8.6).
 * - The colored header banner consumes `var(--cv-primary-color)` via inline
 *   style so it repaints instantly when the user picks a new accent.
 * - Each top-level section receives `id="cv-section-${sectionId}"` exactly
 *   once across the entire template so {@link SectionNav} anchor scrolling
 *   stays unambiguous (Requirements 3.3, 8.2 and Property 9).
 */
export const ProfessionalTemplate = memo(function ProfessionalTemplate({
  data,
  onChange,
}: ProfessionalTemplateProps) {
  // ---------------------------------------------------------------------------
  // Profile updaters — small helpers so JSX stays readable.
  // ---------------------------------------------------------------------------
  const updateProfile = (patch: Partial<CvProfile>) => {
    onChange({ ...data, profile: { ...data.profile, ...patch } });
  };

  const updateLocation = (patch: Partial<NonNullable<CvProfile['location']>>) => {
    onChange({
      ...data,
      profile: {
        ...data.profile,
        location: { ...data.profile.location, ...patch },
      },
    });
  };

  // ---------------------------------------------------------------------------
  // Generic helpers for repeating-entry sections — reorder/delete/replace by
  // index, all immutable updates (Requirement 8.7).
  // ---------------------------------------------------------------------------
  const move = (key: ReorderableSectionKey, index: number, dir: 'up' | 'down') => {
    onChange(reorderSection(data, key, index, dir));
  };

  const remove = (key: ReorderableSectionKey, index: number) => {
    onChange(deleteSectionItem(data, key, index));
  };

  const replaceExperience = (index: number, patch: Partial<CvExperience>) => {
    const next = data.experience.map((item, i) =>
      i === index ? { ...item, ...patch } : item,
    );
    onChange({ ...data, experience: next });
  };

  const replaceEducation = (index: number, patch: Partial<CvEducation>) => {
    const next = data.education.map((item, i) =>
      i === index ? { ...item, ...patch } : item,
    );
    onChange({ ...data, education: next });
  };

  const replaceProject = (index: number, patch: Partial<CvProject>) => {
    const next = data.projects.map((item, i) =>
      i === index ? { ...item, ...patch } : item,
    );
    onChange({ ...data, projects: next });
  };

  const replaceStringAt = (
    key: 'skills' | 'certifications' | 'languages',
    index: number,
    value: string,
  ) => {
    const next = data[key].map((item, i) => (i === index ? value : item));
    onChange({ ...data, [key]: next });
  };

  return (
    <div
      className="flex flex-col gap-0"
      data-testid="cv-template-professional"
      data-template-id="professional"
    >
      {/* ===================================================================
          Header banner — anchors `cv-section-profile`.
          Uses `var(--cv-primary-color)` via inline style so the color is
          driven by the CSS variable rather than a Tailwind utility (which
          cannot consume hex held in a CSS variable in v4).
          =================================================================== */}
      <header
        id="cv-section-profile"
        className="mb-6 py-6 text-white"
        style={{
          // Break out of the canvas page padding so the banner spans the
          // full A4 width. Inline style is used (instead of Tailwind
          // arbitrary values like `-mx-[var(--cv-page-margin)]`) because
          // `calc(... * -1)` is the only reliable way to negate a CSS
          // variable across browsers and Tailwind versions.
          backgroundColor: 'var(--cv-primary-color)',
          marginLeft: 'calc(var(--cv-page-margin) * -1)',
          marginRight: 'calc(var(--cv-page-margin) * -1)',
          marginTop: 'calc(var(--cv-page-margin) * -1)',
          paddingLeft: 'var(--cv-page-margin)',
          paddingRight: 'var(--cv-page-margin)',
        }}
      >
        <h1 className="text-3xl font-bold uppercase tracking-wide">
          <InlineEditableText
            value={data.profile.name}
            onChange={(name) => updateProfile({ name })}
            placeholder="[Họ và tên của bạn]"
            ariaLabel="Họ và tên"
            className="text-white placeholder:text-white/60"
          />
        </h1>
        <div className="mt-2 text-sm text-white/90">
          <InlineEditableText
            value={data.profile.summary ?? ''}
            onChange={(summary) => updateProfile({ summary })}
            placeholder="[Mục tiêu nghề nghiệp ngắn gọn]"
            ariaLabel="Mục tiêu nghề nghiệp"
            type="textarea"
            className="text-white placeholder:text-white/60"
          />
        </div>
      </header>

      {/* ===================================================================
          Two-column body. `flex` instead of `grid` per the design doc so
          that the sidebar can shrink/grow predictably with the canvas
          width changes coming from the zoom transform.
          =================================================================== */}
      <div className="flex gap-6">
        {/* -----------------------------------------------------------------
            Sidebar (35%) — bg-slate-50 holds contact info + the three
            secondary sections (skills, languages, certifications).
            ----------------------------------------------------------------- */}
        <aside className="basis-[35%] shrink-0 rounded-md bg-slate-50 p-4">
          {/* Contact info — part of the profile section, no anchor of its
              own to keep `cv-section-profile` unique. */}
          <ContactInfo
            profile={data.profile}
            onChange={updateProfile}
            onChangeLocation={updateLocation}
          />

          {/* Skills */}
          <section
            id="cv-section-skills"
            className="mt-6"
            aria-labelledby="cv-section-skills-title"
          >
            <SidebarHeading id="cv-section-skills-title">Kỹ năng</SidebarHeading>
            {data.skills.length === 0 ? (
              <EmptyHint label="[Thêm kỹ năng nổi bật]" />
            ) : (
              <ul className="space-y-1.5">
                {data.skills.map((skill, index) => (
                  <BlockOverlay
                    key={`skill-${index}`}
                    onMoveUp={() => move('skills', index, 'up')}
                    onMoveDown={() => move('skills', index, 'down')}
                    onDelete={() => remove('skills', index)}
                    canMoveUp={index > 0}
                    canMoveDown={index < data.skills.length - 1}
                    ariaLabel={`Kỹ năng ${index + 1}`}
                  >
                    <li className="px-1 text-sm text-zinc-800">
                      <InlineEditableText
                        value={skill}
                        onChange={(value) => replaceStringAt('skills', index, value)}
                        placeholder="[Tên kỹ năng]"
                        ariaLabel={`Kỹ năng ${index + 1}`}
                      />
                    </li>
                  </BlockOverlay>
                ))}
              </ul>
            )}
          </section>

          {/* Languages */}
          <section
            id="cv-section-languages"
            className="mt-6"
            aria-labelledby="cv-section-languages-title"
          >
            <SidebarHeading id="cv-section-languages-title">Ngôn ngữ</SidebarHeading>
            {data.languages.length === 0 ? (
              <EmptyHint label="[Thêm ngôn ngữ]" />
            ) : (
              <ul className="space-y-1.5">
                {data.languages.map((language, index) => (
                  <BlockOverlay
                    key={`language-${index}`}
                    onMoveUp={() => move('languages', index, 'up')}
                    onMoveDown={() => move('languages', index, 'down')}
                    onDelete={() => remove('languages', index)}
                    canMoveUp={index > 0}
                    canMoveDown={index < data.languages.length - 1}
                    ariaLabel={`Ngôn ngữ ${index + 1}`}
                  >
                    <li className="px-1 text-sm text-zinc-800">
                      <InlineEditableText
                        value={language}
                        onChange={(value) =>
                          replaceStringAt('languages', index, value)
                        }
                        placeholder="[Tên ngôn ngữ]"
                        ariaLabel={`Ngôn ngữ ${index + 1}`}
                      />
                    </li>
                  </BlockOverlay>
                ))}
              </ul>
            )}
          </section>

          {/* Certifications */}
          <section
            id="cv-section-certifications"
            className="mt-6"
            aria-labelledby="cv-section-certifications-title"
          >
            <SidebarHeading id="cv-section-certifications-title">
              Chứng chỉ
            </SidebarHeading>
            {data.certifications.length === 0 ? (
              <EmptyHint label="[Thêm chứng chỉ]" />
            ) : (
              <ul className="space-y-1.5">
                {data.certifications.map((cert, index) => (
                  <BlockOverlay
                    key={`certification-${index}`}
                    onMoveUp={() => move('certifications', index, 'up')}
                    onMoveDown={() => move('certifications', index, 'down')}
                    onDelete={() => remove('certifications', index)}
                    canMoveUp={index > 0}
                    canMoveDown={index < data.certifications.length - 1}
                    ariaLabel={`Chứng chỉ ${index + 1}`}
                  >
                    <li className="px-1 text-sm text-zinc-800">
                      <InlineEditableText
                        value={cert}
                        onChange={(value) =>
                          replaceStringAt('certifications', index, value)
                        }
                        placeholder="[Tên chứng chỉ]"
                        ariaLabel={`Chứng chỉ ${index + 1}`}
                      />
                    </li>
                  </BlockOverlay>
                ))}
              </ul>
            )}
          </section>
        </aside>

        {/* -----------------------------------------------------------------
            Main column (65%) — experience, education, projects.
            ----------------------------------------------------------------- */}
        <main className="basis-[65%] grow space-y-6">
          {/* Experience */}
          <section
            id="cv-section-experience"
            aria-labelledby="cv-section-experience-title"
          >
            <MainHeading id="cv-section-experience-title">Kinh nghiệm</MainHeading>
            {data.experience.length === 0 ? (
              <EmptyHint label="[Thêm kinh nghiệm làm việc]" />
            ) : (
              <div className="space-y-4">
                {data.experience.map((entry, index) => (
                  <BlockOverlay
                    key={`experience-${index}`}
                    onMoveUp={() => move('experience', index, 'up')}
                    onMoveDown={() => move('experience', index, 'down')}
                    onDelete={() => remove('experience', index)}
                    canMoveUp={index > 0}
                    canMoveDown={index < data.experience.length - 1}
                    ariaLabel={`Kinh nghiệm ${index + 1}`}
                  >
                    <article className="px-1">
                      <h3 className="text-base font-semibold text-zinc-900">
                        <InlineEditableText
                          value={entry.role}
                          onChange={(role) => replaceExperience(index, { role })}
                          placeholder="[Vị trí]"
                          ariaLabel={`Vị trí ${index + 1}`}
                        />
                      </h3>
                      <div className="text-sm font-medium text-[var(--cv-primary-color)]">
                        <InlineEditableText
                          value={entry.company}
                          onChange={(company) =>
                            replaceExperience(index, { company })
                          }
                          placeholder="[Tên công ty]"
                          ariaLabel={`Công ty ${index + 1}`}
                        />
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-500">
                        <span className="basis-[45%]">
                          <InlineEditableText
                            value={entry.startDate}
                            onChange={(startDate) =>
                              replaceExperience(index, { startDate })
                            }
                            placeholder="[Bắt đầu]"
                            ariaLabel={`Ngày bắt đầu ${index + 1}`}
                          />
                        </span>
                        <span aria-hidden="true">—</span>
                        <span className="basis-[45%]">
                          <InlineEditableText
                            value={entry.endDate ?? ''}
                            onChange={(endDate) =>
                              replaceExperience(index, { endDate })
                            }
                            placeholder="[Kết thúc / Hiện tại]"
                            ariaLabel={`Ngày kết thúc ${index + 1}`}
                          />
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-zinc-700">
                        <InlineEditableText
                          value={entry.description ?? ''}
                          onChange={(description) =>
                            replaceExperience(index, { description })
                          }
                          placeholder="[Mô tả công việc, thành tựu, công nghệ sử dụng...]"
                          type="textarea"
                          ariaLabel={`Mô tả công việc ${index + 1}`}
                        />
                      </div>
                    </article>
                  </BlockOverlay>
                ))}
              </div>
            )}
          </section>

          {/* Education */}
          <section
            id="cv-section-education"
            aria-labelledby="cv-section-education-title"
          >
            <MainHeading id="cv-section-education-title">Học vấn</MainHeading>
            {data.education.length === 0 ? (
              <EmptyHint label="[Thêm thông tin học vấn]" />
            ) : (
              <div className="space-y-4">
                {data.education.map((entry, index) => (
                  <BlockOverlay
                    key={`education-${index}`}
                    onMoveUp={() => move('education', index, 'up')}
                    onMoveDown={() => move('education', index, 'down')}
                    onDelete={() => remove('education', index)}
                    canMoveUp={index > 0}
                    canMoveDown={index < data.education.length - 1}
                    ariaLabel={`Học vấn ${index + 1}`}
                  >
                    <article className="px-1">
                      <h3 className="text-base font-semibold text-zinc-900">
                        <InlineEditableText
                          value={entry.school}
                          onChange={(school) =>
                            replaceEducation(index, { school })
                          }
                          placeholder="[Tên trường]"
                          ariaLabel={`Trường ${index + 1}`}
                        />
                      </h3>
                      <div className="text-sm font-medium text-[var(--cv-primary-color)]">
                        <InlineEditableText
                          value={entry.degree}
                          onChange={(degree) =>
                            replaceEducation(index, { degree })
                          }
                          placeholder="[Bằng cấp]"
                          ariaLabel={`Bằng cấp ${index + 1}`}
                        />
                      </div>
                      <div className="text-sm text-zinc-700">
                        <InlineEditableText
                          value={entry.field ?? ''}
                          onChange={(field) =>
                            replaceEducation(index, { field })
                          }
                          placeholder="[Chuyên ngành]"
                          ariaLabel={`Chuyên ngành ${index + 1}`}
                        />
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-500">
                        <span className="basis-[45%]">
                          <InlineEditableText
                            value={entry.startDate ?? ''}
                            onChange={(startDate) =>
                              replaceEducation(index, { startDate })
                            }
                            placeholder="[Bắt đầu]"
                            ariaLabel={`Ngày bắt đầu học ${index + 1}`}
                          />
                        </span>
                        <span aria-hidden="true">—</span>
                        <span className="basis-[45%]">
                          <InlineEditableText
                            value={entry.endDate ?? ''}
                            onChange={(endDate) =>
                              replaceEducation(index, { endDate })
                            }
                            placeholder="[Kết thúc]"
                            ariaLabel={`Ngày kết thúc học ${index + 1}`}
                          />
                        </span>
                      </div>
                    </article>
                  </BlockOverlay>
                ))}
              </div>
            )}
          </section>

          {/* Projects */}
          <section
            id="cv-section-projects"
            aria-labelledby="cv-section-projects-title"
          >
            <MainHeading id="cv-section-projects-title">Dự án</MainHeading>
            {data.projects.length === 0 ? (
              <EmptyHint label="[Thêm dự án nổi bật]" />
            ) : (
              <div className="space-y-4">
                {data.projects.map((project, index) => (
                  <BlockOverlay
                    key={`project-${index}`}
                    onMoveUp={() => move('projects', index, 'up')}
                    onMoveDown={() => move('projects', index, 'down')}
                    onDelete={() => remove('projects', index)}
                    canMoveUp={index > 0}
                    canMoveDown={index < data.projects.length - 1}
                    ariaLabel={`Dự án ${index + 1}`}
                  >
                    <article className="px-1">
                      <h3 className="text-base font-semibold text-zinc-900">
                        <InlineEditableText
                          value={project.name}
                          onChange={(name) => replaceProject(index, { name })}
                          placeholder="[Tên dự án]"
                          ariaLabel={`Tên dự án ${index + 1}`}
                        />
                      </h3>
                      <div className="mt-1 text-sm text-zinc-700">
                        <InlineEditableText
                          value={project.description ?? ''}
                          onChange={(description) =>
                            replaceProject(index, { description })
                          }
                          placeholder="[Mô tả dự án, vai trò, công nghệ...]"
                          type="textarea"
                          ariaLabel={`Mô tả dự án ${index + 1}`}
                        />
                      </div>
                    </article>
                  </BlockOverlay>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
});

// ---------------------------------------------------------------------------
// Sub-components — small, focused, presentational.
// ---------------------------------------------------------------------------

/**
 * Compact contact-info block displayed inside the sidebar. Belongs to the
 * profile section logically but does not own its own section anchor; the
 * single `cv-section-profile` anchor lives on the header banner so that
 * Property 9 (one anchor per section) holds for this template.
 */
function ContactInfo({
  profile,
  onChange,
  onChangeLocation,
}: {
  profile: CvProfile;
  onChange: (patch: Partial<CvProfile>) => void;
  onChangeLocation: (patch: Partial<NonNullable<CvProfile['location']>>) => void;
}) {
  return (
    <section aria-label="Thông tin liên hệ">
      <SidebarHeading>Liên hệ</SidebarHeading>
      <dl className="space-y-1.5 text-sm text-zinc-800">
        <ContactRow label="Email">
          <InlineEditableText
            value={profile.email ?? ''}
            onChange={(email) => onChange({ email })}
            placeholder="[email@example.com]"
            ariaLabel="Email"
          />
        </ContactRow>
        <ContactRow label="Điện thoại">
          <InlineEditableText
            value={profile.phone ?? ''}
            onChange={(phone) => onChange({ phone })}
            placeholder="[0909 123 456]"
            ariaLabel="Điện thoại"
          />
        </ContactRow>
        <ContactRow label="Website">
          <InlineEditableText
            value={profile.website ?? ''}
            onChange={(website) => onChange({ website })}
            placeholder="[linkedin.com/in/...]"
            ariaLabel="Website"
          />
        </ContactRow>
        <ContactRow label="Thành phố">
          <InlineEditableText
            value={profile.location?.city ?? ''}
            onChange={(city) => onChangeLocation({ city })}
            placeholder="[Hồ Chí Minh]"
            ariaLabel="Thành phố"
          />
        </ContactRow>
        <ContactRow label="Quốc gia">
          <InlineEditableText
            value={profile.location?.country ?? ''}
            onChange={(country) => onChangeLocation({ country })}
            placeholder="[Việt Nam]"
            ariaLabel="Quốc gia"
          />
        </ContactRow>
      </dl>
    </section>
  );
}

function ContactRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </dt>
      <dd className="text-sm text-zinc-800">{children}</dd>
    </div>
  );
}

/**
 * Sidebar section heading — small uppercase label with an underline in the
 * accent color so that section boundaries stay visible against the slate-50
 * background while still consuming `var(--cv-primary-color)`.
 */
function SidebarHeading({
  id,
  children,
}: {
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <h2
      id={id}
      className="mb-2 border-b-2 pb-1 text-xs font-bold uppercase tracking-wider text-[var(--cv-primary-color)]"
      style={{ borderColor: 'var(--cv-primary-color)' }}
    >
      {children}
    </h2>
  );
}

/**
 * Main-column section heading — slightly larger, uses the accent color, and
 * has a thin gray bottom rule to mirror the polished feel of the sidebar.
 */
function MainHeading({
  id,
  children,
}: {
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <h2
      id={id}
      className="mb-3 border-b border-zinc-200 pb-1 text-base font-bold uppercase tracking-wider text-[var(--cv-primary-color)]"
    >
      {children}
    </h2>
  );
}

/** Tiny placeholder shown when a section has zero entries. */
function EmptyHint({ label }: { label: string }) {
  return <p className="text-xs italic text-zinc-400">{label}</p>;
}
