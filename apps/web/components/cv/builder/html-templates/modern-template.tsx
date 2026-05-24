'use client';

import { memo } from 'react';

import {
  type CvBuilderData,
  type CvDesignTokens,
  type CvEducation,
  type CvExperience,
  type CvProject,
  DEFAULT_DESIGN_TOKENS,
} from '@/types/cv-builder';

import { BlockOverlay } from '../block-overlay';
import { InlineEditableText } from '../inline-editable-text';
import {
  deleteSectionItem,
  reorderSection,
  type ReorderableSectionKey,
} from '../section-helpers';

import { withAlpha } from './with-alpha';

/**
 * Props for {@link ModernTemplate}.
 *
 * Both fields mirror the contract shared by all CV Builder 2.0 HTML templates
 * (`SimpleTemplate`, `ProfessionalTemplate`, `ModernTemplate`):
 *
 * - `data`     — the single source of truth held by `CvBuilderPage`.
 * - `onChange` — the parent updater. The template is purely presentational and
 *                never holds CV state of its own (Requirement 8.7).
 */
export interface ModernTemplateProps {
  data: CvBuilderData;
  onChange: (updated: CvBuilderData) => void;
}

/**
 * Section ids used as scroll anchors by `SectionNav`. Each top-level section
 * in the rendered template is marked with `id="cv-section-${sectionId}"`
 * (Requirements 3.3, 8.4).
 */
type SectionId =
  | 'profile'
  | 'experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'certifications'
  | 'languages';

const SECTION_TITLES: Record<Exclude<SectionId, 'profile'>, string> = {
  experience: 'Kinh nghiệm làm việc',
  education: 'Học vấn',
  skills: 'Kỹ năng',
  projects: 'Dự án',
  certifications: 'Chứng chỉ',
  languages: 'Ngôn ngữ',
};

/**
 * ModernTemplate
 * --------------
 * Single-column CV layout with rounded "pill" section headers tinted with a
 * lightened version of the user's accent colour. Inline editing, block overlay
 * controls, and section anchors are wired identically to `SimpleTemplate`.
 *
 * Why the pill background uses an inline `style` instead of a Tailwind class:
 * Tailwind v4 cannot apply opacity modifiers (e.g. `/10`) to a value that
 * comes from a CSS custom property. The pill background therefore has to be
 * computed in JavaScript via {@link withAlpha} and applied via inline style
 * (Requirements 5.7, 8.3).
 *
 * Design tokens fallback: legacy CVs created before CV Builder 2.0 may not
 * have `designTokens` persisted. We fall back to {@link DEFAULT_DESIGN_TOKENS}
 * so the pill background colour is always well-defined (Requirement 7.10).
 *
 * Performance: the component is wrapped in {@link memo} so the canvas can
 * skip re-rendering the entire template subtree when its `{ data, onChange }`
 * props are referentially stable. Combined with `useDeferredValue` upstream
 * in `CvHtmlCanvas`, this keeps the inline editor responsive while users
 * type (Requirements 5.4, 12.1, 12.2).
 */
export const ModernTemplate = memo(function ModernTemplate({
  data,
  onChange,
}: ModernTemplateProps) {
  const tokens: CvDesignTokens = data.designTokens ?? DEFAULT_DESIGN_TOKENS;
  const pillBackground = withAlpha(tokens.primaryColor);

  // Helpers that return new `CvBuilderData` references — `CvBuilderPage`
  // commits these via the immutable updater pattern.
  const handleReorder = (
    sectionKey: ReorderableSectionKey,
    index: number,
    direction: 'up' | 'down',
  ) => {
    onChange(reorderSection(data, sectionKey, index, direction));
  };

  const handleDelete = (sectionKey: ReorderableSectionKey, index: number) => {
    onChange(deleteSectionItem(data, sectionKey, index));
  };

  return (
    <div
      className="flex flex-col gap-6"
      data-testid="cv-template-modern"
      data-template-id="modern"
    >
      <ProfileSection data={data} onChange={onChange} />

      <ExperienceSection
        data={data}
        pillBackground={pillBackground}
        onChange={onChange}
        onReorder={(index, direction) =>
          handleReorder('experience', index, direction)
        }
        onDelete={(index) => handleDelete('experience', index)}
      />

      <EducationSection
        data={data}
        pillBackground={pillBackground}
        onChange={onChange}
        onReorder={(index, direction) =>
          handleReorder('education', index, direction)
        }
        onDelete={(index) => handleDelete('education', index)}
      />

      <SkillsSection
        data={data}
        pillBackground={pillBackground}
        onChange={onChange}
        onReorder={(index, direction) =>
          handleReorder('skills', index, direction)
        }
        onDelete={(index) => handleDelete('skills', index)}
      />

      <ProjectsSection
        data={data}
        pillBackground={pillBackground}
        onChange={onChange}
        onReorder={(index, direction) =>
          handleReorder('projects', index, direction)
        }
        onDelete={(index) => handleDelete('projects', index)}
      />

      <CertificationsSection
        data={data}
        pillBackground={pillBackground}
        onChange={onChange}
        onReorder={(index, direction) =>
          handleReorder('certifications', index, direction)
        }
        onDelete={(index) => handleDelete('certifications', index)}
      />

      <LanguagesSection
        data={data}
        pillBackground={pillBackground}
        onChange={onChange}
        onReorder={(index, direction) =>
          handleReorder('languages', index, direction)
        }
        onDelete={(index) => handleDelete('languages', index)}
      />
    </div>
  );
});

/* -------------------------------------------------------------------------- */
/* Pill section header                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Rounded pill heading shared by every non-profile section. The pill uses an
 * inline `style.backgroundColor` populated by {@link withAlpha} so the tint
 * tracks the user's chosen accent colour even when it comes from a CSS
 * variable (Requirement 5.7, 8.3).
 *
 * Text colour comes from `text-[var(--cv-primary-color)]` so it stays in sync
 * with `tokens.primaryColor` automatically (Requirement 8.6).
 */
function PillHeading({
  children,
  pillBackground,
}: {
  children: React.ReactNode;
  pillBackground: string;
}) {
  return (
    <h2
      className="inline-block rounded-full px-4 py-1 text-[1.05em] font-semibold uppercase tracking-wide text-[var(--cv-primary-color)]"
      style={{ backgroundColor: pillBackground }}
    >
      {children}
    </h2>
  );
}

/* -------------------------------------------------------------------------- */
/* Profile                                                                    */
/* -------------------------------------------------------------------------- */

function ProfileSection({
  data,
  onChange,
}: {
  data: CvBuilderData;
  onChange: (updated: CvBuilderData) => void;
}) {
  const { profile } = data;

  const updateProfile = (patch: Partial<typeof profile>) => {
    onChange({ ...data, profile: { ...profile, ...patch } });
  };

  const updateLocation = (patch: Partial<NonNullable<typeof profile.location>>) => {
    onChange({
      ...data,
      profile: {
        ...profile,
        location: { ...(profile.location ?? {}), ...patch },
      },
    });
  };

  return (
    <section
      id="cv-section-profile"
      className="flex flex-col gap-2 border-b border-zinc-200 pb-4"
    >
      <InlineEditableText
        value={profile.name}
        onChange={(name) => updateProfile({ name })}
        placeholder="[Họ và tên]"
        ariaLabel="Họ và tên"
        className="text-[2em] font-bold leading-tight text-[var(--cv-primary-color)]"
      />

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.9em] text-zinc-600">
        <InlineEditableText
          value={profile.email ?? ''}
          onChange={(email) => updateProfile({ email })}
          placeholder="email@domain.com"
          ariaLabel="Email"
          className="min-w-[8ch]"
        />
        <span aria-hidden="true">•</span>
        <InlineEditableText
          value={profile.phone ?? ''}
          onChange={(phone) => updateProfile({ phone })}
          placeholder="Số điện thoại"
          ariaLabel="Số điện thoại"
          className="min-w-[8ch]"
        />
        <span aria-hidden="true">•</span>
        <InlineEditableText
          value={profile.website ?? ''}
          onChange={(website) => updateProfile({ website })}
          placeholder="Website / LinkedIn"
          ariaLabel="Website"
          className="min-w-[8ch]"
        />
        <span aria-hidden="true">•</span>
        <InlineEditableText
          value={profile.location?.city ?? ''}
          onChange={(city) => updateLocation({ city })}
          placeholder="Thành phố"
          ariaLabel="Thành phố"
          className="min-w-[6ch]"
        />
      </div>

      <InlineEditableText
        type="textarea"
        value={profile.summary ?? ''}
        onChange={(summary) => updateProfile({ summary })}
        placeholder="[Tóm tắt ngắn về bản thân, mục tiêu nghề nghiệp...]"
        ariaLabel="Tóm tắt"
        className="text-[0.95em] leading-relaxed text-zinc-700"
      />
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Experience                                                                 */
/* -------------------------------------------------------------------------- */

interface RepeatingSectionProps {
  data: CvBuilderData;
  pillBackground: string;
  onChange: (updated: CvBuilderData) => void;
  onReorder: (index: number, direction: 'up' | 'down') => void;
  onDelete: (index: number) => void;
}

function ExperienceSection({
  data,
  pillBackground,
  onChange,
  onReorder,
  onDelete,
}: RepeatingSectionProps) {
  const updateEntry = (index: number, patch: Partial<CvExperience>) => {
    const next = data.experience.map((entry, i) =>
      i === index ? { ...entry, ...patch } : entry,
    );
    onChange({ ...data, experience: next });
  };

  return (
    <section id="cv-section-experience" className="flex flex-col gap-3">
      <PillHeading pillBackground={pillBackground}>
        {SECTION_TITLES.experience}
      </PillHeading>

      {data.experience.length === 0 ? (
        <p className="text-[0.9em] italic text-zinc-400">
          Chưa có kinh nghiệm nào. Hãy thêm từ panel chỉnh sửa.
        </p>
      ) : (
        data.experience.map((entry, index) => (
          <BlockOverlay
            key={index}
            canMoveUp={index > 0}
            canMoveDown={index < data.experience.length - 1}
            onMoveUp={() => onReorder(index, 'up')}
            onMoveDown={() => onReorder(index, 'down')}
            onDelete={() => onDelete(index)}
            ariaLabel={`Khối kinh nghiệm ${index + 1}`}
          >
            <div className="flex flex-col gap-1 px-2 py-1">
              <InlineEditableText
                value={entry.role}
                onChange={(role) => updateEntry(index, { role })}
                placeholder="[Chức danh]"
                ariaLabel="Chức danh"
                className="text-[1.05em] font-semibold text-zinc-900"
              />
              <InlineEditableText
                value={entry.company}
                onChange={(company) => updateEntry(index, { company })}
                placeholder="[Công ty]"
                ariaLabel="Công ty"
                className="text-[0.95em] font-medium text-[var(--cv-primary-color)]"
              />
              <div className="flex flex-wrap items-center gap-x-2 text-[0.85em] text-zinc-500">
                <InlineEditableText
                  value={entry.startDate}
                  onChange={(startDate) => updateEntry(index, { startDate })}
                  placeholder="MM/YYYY"
                  ariaLabel="Ngày bắt đầu"
                  className="min-w-[6ch]"
                />
                <span aria-hidden="true">—</span>
                <InlineEditableText
                  value={entry.endDate ?? ''}
                  onChange={(endDate) => updateEntry(index, { endDate })}
                  placeholder="Hiện tại"
                  ariaLabel="Ngày kết thúc"
                  className="min-w-[6ch]"
                />
              </div>
              <InlineEditableText
                type="textarea"
                value={entry.description ?? ''}
                onChange={(description) => updateEntry(index, { description })}
                placeholder="[Mô tả công việc và thành tựu]"
                ariaLabel="Mô tả công việc"
                className="text-[0.9em] leading-relaxed text-zinc-700"
              />
            </div>
          </BlockOverlay>
        ))
      )}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Education                                                                  */
/* -------------------------------------------------------------------------- */

function EducationSection({
  data,
  pillBackground,
  onChange,
  onReorder,
  onDelete,
}: RepeatingSectionProps) {
  const updateEntry = (index: number, patch: Partial<CvEducation>) => {
    const next = data.education.map((entry, i) =>
      i === index ? { ...entry, ...patch } : entry,
    );
    onChange({ ...data, education: next });
  };

  return (
    <section id="cv-section-education" className="flex flex-col gap-3">
      <PillHeading pillBackground={pillBackground}>
        {SECTION_TITLES.education}
      </PillHeading>

      {data.education.length === 0 ? (
        <p className="text-[0.9em] italic text-zinc-400">
          Chưa có thông tin học vấn.
        </p>
      ) : (
        data.education.map((entry, index) => (
          <BlockOverlay
            key={index}
            canMoveUp={index > 0}
            canMoveDown={index < data.education.length - 1}
            onMoveUp={() => onReorder(index, 'up')}
            onMoveDown={() => onReorder(index, 'down')}
            onDelete={() => onDelete(index)}
            ariaLabel={`Khối học vấn ${index + 1}`}
          >
            <div className="flex flex-col gap-1 px-2 py-1">
              <InlineEditableText
                value={entry.school}
                onChange={(school) => updateEntry(index, { school })}
                placeholder="[Trường]"
                ariaLabel="Trường"
                className="text-[1.05em] font-semibold text-zinc-900"
              />
              <InlineEditableText
                value={entry.degree}
                onChange={(degree) => updateEntry(index, { degree })}
                placeholder="[Bằng cấp]"
                ariaLabel="Bằng cấp"
                className="text-[0.95em] font-medium text-[var(--cv-primary-color)]"
              />
              <InlineEditableText
                value={entry.field ?? ''}
                onChange={(field) => updateEntry(index, { field })}
                placeholder="[Chuyên ngành]"
                ariaLabel="Chuyên ngành"
                className="text-[0.9em] text-zinc-600"
              />
              <div className="flex flex-wrap items-center gap-x-2 text-[0.85em] text-zinc-500">
                <InlineEditableText
                  value={entry.startDate ?? ''}
                  onChange={(startDate) => updateEntry(index, { startDate })}
                  placeholder="MM/YYYY"
                  ariaLabel="Ngày bắt đầu"
                  className="min-w-[6ch]"
                />
                <span aria-hidden="true">—</span>
                <InlineEditableText
                  value={entry.endDate ?? ''}
                  onChange={(endDate) => updateEntry(index, { endDate })}
                  placeholder="Hiện tại"
                  ariaLabel="Ngày kết thúc"
                  className="min-w-[6ch]"
                />
              </div>
              {entry.gpa !== undefined ? (
                <InlineEditableText
                  value={entry.gpa}
                  onChange={(gpa) => updateEntry(index, { gpa })}
                  placeholder="GPA"
                  ariaLabel="GPA"
                  className="text-[0.85em] text-zinc-500"
                />
              ) : null}
            </div>
          </BlockOverlay>
        ))
      )}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Skills                                                                     */
/* -------------------------------------------------------------------------- */

function SkillsSection({
  data,
  pillBackground,
  onChange,
  onReorder,
  onDelete,
}: RepeatingSectionProps) {
  const updateSkill = (index: number, value: string) => {
    const next = data.skills.map((skill, i) => (i === index ? value : skill));
    onChange({ ...data, skills: next });
  };

  return (
    <section id="cv-section-skills" className="flex flex-col gap-3">
      <PillHeading pillBackground={pillBackground}>
        {SECTION_TITLES.skills}
      </PillHeading>

      {data.skills.length === 0 ? (
        <p className="text-[0.9em] italic text-zinc-400">
          Chưa có kỹ năng nào.
        </p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {data.skills.map((skill, index) => (
            <BlockOverlay
              key={index}
              canMoveUp={index > 0}
              canMoveDown={index < data.skills.length - 1}
              onMoveUp={() => onReorder(index, 'up')}
              onMoveDown={() => onReorder(index, 'down')}
              onDelete={() => onDelete(index)}
              ariaLabel={`Kỹ năng ${index + 1}`}
              className="inline-flex"
            >
              <li
                className="rounded-full px-3 py-0.5 text-[0.9em] text-[var(--cv-primary-color)]"
                style={{ backgroundColor: pillBackground }}
              >
                <InlineEditableText
                  value={skill}
                  onChange={(value) => updateSkill(index, value)}
                  placeholder="[Kỹ năng]"
                  ariaLabel={`Kỹ năng ${index + 1}`}
                  className="min-w-[4ch]"
                />
              </li>
            </BlockOverlay>
          ))}
        </ul>
      )}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Projects                                                                   */
/* -------------------------------------------------------------------------- */

function ProjectsSection({
  data,
  pillBackground,
  onChange,
  onReorder,
  onDelete,
}: RepeatingSectionProps) {
  const updateEntry = (index: number, patch: Partial<CvProject>) => {
    const next = data.projects.map((entry, i) =>
      i === index ? { ...entry, ...patch } : entry,
    );
    onChange({ ...data, projects: next });
  };

  return (
    <section id="cv-section-projects" className="flex flex-col gap-3">
      <PillHeading pillBackground={pillBackground}>
        {SECTION_TITLES.projects}
      </PillHeading>

      {data.projects.length === 0 ? (
        <p className="text-[0.9em] italic text-zinc-400">
          Chưa có dự án nào.
        </p>
      ) : (
        data.projects.map((entry, index) => (
          <BlockOverlay
            key={index}
            canMoveUp={index > 0}
            canMoveDown={index < data.projects.length - 1}
            onMoveUp={() => onReorder(index, 'up')}
            onMoveDown={() => onReorder(index, 'down')}
            onDelete={() => onDelete(index)}
            ariaLabel={`Dự án ${index + 1}`}
          >
            <div className="flex flex-col gap-1 px-2 py-1">
              <InlineEditableText
                value={entry.name}
                onChange={(name) => updateEntry(index, { name })}
                placeholder="[Tên dự án]"
                ariaLabel="Tên dự án"
                className="text-[1.05em] font-semibold text-[var(--cv-primary-color)]"
              />
              <InlineEditableText
                type="textarea"
                value={entry.description ?? ''}
                onChange={(description) => updateEntry(index, { description })}
                placeholder="[Mô tả dự án]"
                ariaLabel="Mô tả dự án"
                className="text-[0.9em] leading-relaxed text-zinc-700"
              />
              {entry.tech && entry.tech.length > 0 ? (
                <p className="text-[0.85em] italic text-zinc-500">
                  Tech: {entry.tech.join(', ')}
                </p>
              ) : null}
            </div>
          </BlockOverlay>
        ))
      )}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Certifications                                                             */
/* -------------------------------------------------------------------------- */

function CertificationsSection({
  data,
  pillBackground,
  onChange,
  onReorder,
  onDelete,
}: RepeatingSectionProps) {
  const updateItem = (index: number, value: string) => {
    const next = data.certifications.map((item, i) =>
      i === index ? value : item,
    );
    onChange({ ...data, certifications: next });
  };

  return (
    <section id="cv-section-certifications" className="flex flex-col gap-3">
      <PillHeading pillBackground={pillBackground}>
        {SECTION_TITLES.certifications}
      </PillHeading>

      {data.certifications.length === 0 ? (
        <p className="text-[0.9em] italic text-zinc-400">
          Chưa có chứng chỉ nào.
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {data.certifications.map((item, index) => (
            <BlockOverlay
              key={index}
              canMoveUp={index > 0}
              canMoveDown={index < data.certifications.length - 1}
              onMoveUp={() => onReorder(index, 'up')}
              onMoveDown={() => onReorder(index, 'down')}
              onDelete={() => onDelete(index)}
              ariaLabel={`Chứng chỉ ${index + 1}`}
            >
              <li className="px-2 py-0.5 text-[0.9em] text-zinc-700">
                <InlineEditableText
                  value={item}
                  onChange={(value) => updateItem(index, value)}
                  placeholder="[Tên chứng chỉ]"
                  ariaLabel={`Chứng chỉ ${index + 1}`}
                />
              </li>
            </BlockOverlay>
          ))}
        </ul>
      )}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Languages                                                                  */
/* -------------------------------------------------------------------------- */

function LanguagesSection({
  data,
  pillBackground,
  onChange,
  onReorder,
  onDelete,
}: RepeatingSectionProps) {
  const updateItem = (index: number, value: string) => {
    const next = data.languages.map((item, i) => (i === index ? value : item));
    onChange({ ...data, languages: next });
  };

  return (
    <section id="cv-section-languages" className="flex flex-col gap-3">
      <PillHeading pillBackground={pillBackground}>
        {SECTION_TITLES.languages}
      </PillHeading>

      {data.languages.length === 0 ? (
        <p className="text-[0.9em] italic text-zinc-400">
          Chưa có ngôn ngữ nào.
        </p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {data.languages.map((item, index) => (
            <BlockOverlay
              key={index}
              canMoveUp={index > 0}
              canMoveDown={index < data.languages.length - 1}
              onMoveUp={() => onReorder(index, 'up')}
              onMoveDown={() => onReorder(index, 'down')}
              onDelete={() => onDelete(index)}
              ariaLabel={`Ngôn ngữ ${index + 1}`}
              className="inline-flex"
            >
              <li
                className="rounded-full px-3 py-0.5 text-[0.9em] text-[var(--cv-primary-color)]"
                style={{ backgroundColor: pillBackground }}
              >
                <InlineEditableText
                  value={item}
                  onChange={(value) => updateItem(index, value)}
                  placeholder="[Ngôn ngữ]"
                  ariaLabel={`Ngôn ngữ ${index + 1}`}
                  className="min-w-[4ch]"
                />
              </li>
            </BlockOverlay>
          ))}
        </ul>
      )}
    </section>
  );
}
