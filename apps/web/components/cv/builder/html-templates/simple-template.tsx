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
import { deleteSectionItem, reorderSection } from '../section-helpers';

/**
 * Props for {@link SimpleTemplate}.
 *
 * The template owns no state of its own — every mutation is propagated to the
 * parent through {@link SimpleTemplateProps.onChange} so `CvBuilderPage`
 * remains the single source of truth (Requirement 8.7).
 */
export interface SimpleTemplateProps {
  /** Full CV data driving the render. */
  data: CvBuilderData;
  /**
   * Called with the next, fully-rebuilt {@link CvBuilderData} whenever an
   * inline editor commits a value or a block overlay reorder/delete action
   * fires.
   */
  onChange: (updated: CvBuilderData) => void;
}

/**
 * Tailwind class strings reused across sections. Keeping them as constants
 * avoids subtle drift between the seven section blocks and makes the look
 * easy to tweak in one place.
 */
const SECTION_WRAPPER_CLASS = 'mt-5 border-t border-zinc-200 pt-3 first:mt-0 first:border-t-0 first:pt-0';
const SECTION_HEADING_CLASS =
  'mb-2 text-[1.05em] font-semibold uppercase tracking-wide text-[var(--cv-primary-color)]';
const ENTRY_WRAPPER_CLASS = 'py-2';
const META_TEXT_CLASS = 'text-[0.9em] text-zinc-600';

/**
 * `SimpleTemplate` is the ATS-friendly, single-column variant of the CV
 * canvas. It targets candidates who want a clean, neutral layout that
 * applicant tracking systems can parse without tripping over multi-column
 * positioning or decorative graphics.
 *
 * Layout summary:
 * - One column, full canvas width.
 * - Centered profile header with the candidate name in the accent color and
 *   a dot-separated contact line below it.
 * - Sections separated by a thin gray rule (`border-t border-zinc-200`).
 * - Each repeating entry (experience / education / project) is wrapped in a
 *   {@link BlockOverlay} so users can reorder it via the floating ↑ / ↓
 *   buttons or remove it via ✕.
 *
 * Editing rules:
 * - Every editable text node uses {@link InlineEditableText} so input is
 *   plain-text (Requirement 11.1) and only commits on blur (Requirement 1.3).
 * - The accent color is consumed via the `--cv-primary-color` CSS variable
 *   exposed by `CvHtmlCanvas`, so it repaints instantly when the user drags
 *   the color picker (Requirement 8.6).
 *
 * Anchor IDs:
 * - Each top-level section carries `id="cv-section-${sectionId}"` so the
 *   `SectionNav` panel can scroll to it (Requirement 3.3). All seven section
 *   anchors are rendered unconditionally — even when the underlying array is
 *   empty — to keep the navigation stable.
 *
 * Performance:
 * - The component is wrapped in {@link memo} so the canvas can skip
 *   re-rendering the entire template subtree when its `{ data, onChange }`
 *   props are referentially stable. Combined with `useDeferredValue`
 *   upstream in `CvHtmlCanvas`, this keeps the inline editor responsive
 *   while users type (Requirements 5.4, 12.1, 12.2).
 */
export const SimpleTemplate = memo(function SimpleTemplate({
  data,
  onChange,
}: SimpleTemplateProps) {
  // ------------------------- mutation helpers ------------------------------

  const updateProfile = (patch: Partial<CvProfile>) => {
    onChange({ ...data, profile: { ...data.profile, ...patch } });
  };

  const updateLocation = (patch: Partial<NonNullable<CvProfile['location']>>) => {
    const current = data.profile.location ?? {};
    onChange({
      ...data,
      profile: { ...data.profile, location: { ...current, ...patch } },
    });
  };

  const updateExperience = (index: number, patch: Partial<CvExperience>) => {
    const next = data.experience.slice();
    next[index] = { ...next[index], ...patch };
    onChange({ ...data, experience: next });
  };

  const updateEducation = (index: number, patch: Partial<CvEducation>) => {
    const next = data.education.slice();
    next[index] = { ...next[index], ...patch };
    onChange({ ...data, education: next });
  };

  const updateProject = (index: number, patch: Partial<CvProject>) => {
    const next = data.projects.slice();
    next[index] = { ...next[index], ...patch };
    onChange({ ...data, projects: next });
  };

  const replaceStringList = (
    key: 'skills' | 'certifications' | 'languages',
    raw: string,
  ) => {
    // Treat the comma-separated input as the canonical source so users can
    // freely add, remove, and reorder list items by editing one text field.
    // Empty fragments (e.g. trailing commas) are dropped so the rendered list
    // stays tidy.
    const items = raw
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    onChange({ ...data, [key]: items });
  };

  // Comma-joined view of a string list, with a single trailing space after
  // each comma so users see exactly the formatting they will get on save.
  const joinList = (items: readonly string[]) => items.join(', ');

  // ------------------------- entry-level handlers --------------------------

  const handleReorder = (
    section: 'experience' | 'education' | 'projects',
    index: number,
    direction: 'up' | 'down',
  ) => {
    onChange(reorderSection(data, section, index, direction));
  };

  const handleDelete = (
    section: 'experience' | 'education' | 'projects',
    index: number,
  ) => {
    onChange(deleteSectionItem(data, section, index));
  };

  // ------------------------- render ----------------------------------------

  return (
    <div className="flex flex-col" data-testid="cv-template-simple">
      {/* ------------------------------ Profile ------------------------------ */}
      <section
        id="cv-section-profile"
        className="text-center"
        aria-label="Hồ sơ"
      >
        <h1 className="text-[2em] font-bold uppercase tracking-wide text-[var(--cv-primary-color)]">
          <InlineEditableText
            value={data.profile.name}
            onChange={(name) => updateProfile({ name })}
            placeholder="[Nhập tên của bạn]"
            ariaLabel="Họ và tên"
            className="text-center"
          />
        </h1>

        {/*
          Dot-separated contact line. Each field is its own inline editor so
          the user can edit any single value without retyping the others.
          `inline-block w-auto` overrides the `block w-full` baseline of
          `InlineEditableText` so multiple editors flow on the same line.
        */}
        <div
          className={`mt-1 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 ${META_TEXT_CLASS}`}
        >
          <InlineEditableText
            value={data.profile.email ?? ''}
            onChange={(email) => updateProfile({ email })}
            placeholder="email@example.com"
            ariaLabel="Email"
            className="inline-block w-auto text-center"
          />
          <span aria-hidden="true">·</span>
          <InlineEditableText
            value={data.profile.phone ?? ''}
            onChange={(phone) => updateProfile({ phone })}
            placeholder="Số điện thoại"
            ariaLabel="Số điện thoại"
            className="inline-block w-auto text-center"
          />
          <span aria-hidden="true">·</span>
          <InlineEditableText
            value={data.profile.website ?? ''}
            onChange={(website) => updateProfile({ website })}
            placeholder="Website / LinkedIn"
            ariaLabel="Website"
            className="inline-block w-auto text-center"
          />
          <span aria-hidden="true">·</span>
          <InlineEditableText
            value={data.profile.location?.city ?? ''}
            onChange={(city) => updateLocation({ city })}
            placeholder="Thành phố"
            ariaLabel="Thành phố"
            className="inline-block w-auto text-center"
          />
          <span aria-hidden="true">·</span>
          <InlineEditableText
            value={data.profile.location?.country ?? ''}
            onChange={(country) => updateLocation({ country })}
            placeholder="Quốc gia"
            ariaLabel="Quốc gia"
            className="inline-block w-auto text-center"
          />
        </div>

        {/*
          Summary always renders so users can author it inline. When the value
          is empty the placeholder communicates intent without collapsing the
          vertical footprint (Requirement 14.2).
        */}
        <p className="mt-3 text-left text-[0.95em] text-zinc-700">
          <InlineEditableText
            type="textarea"
            value={data.profile.summary ?? ''}
            onChange={(summary) => updateProfile({ summary })}
            placeholder="Tóm tắt ngắn gọn về bạn, mục tiêu nghề nghiệp..."
            ariaLabel="Tóm tắt"
          />
        </p>
      </section>

      {/* ----------------------------- Experience --------------------------- */}
      <section
        id="cv-section-experience"
        className={SECTION_WRAPPER_CLASS}
        aria-label="Kinh nghiệm làm việc"
      >
        <h2 className={SECTION_HEADING_CLASS}>Kinh nghiệm làm việc</h2>
        {data.experience.map((exp, index) => (
          <BlockOverlay
            key={index}
            ariaLabel={`Kinh nghiệm ${index + 1}`}
            canMoveUp={index > 0}
            canMoveDown={index < data.experience.length - 1}
            onMoveUp={() => handleReorder('experience', index, 'up')}
            onMoveDown={() => handleReorder('experience', index, 'down')}
            onDelete={() => handleDelete('experience', index)}
          >
            <div className={ENTRY_WRAPPER_CLASS}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <div className="font-semibold">
                  <InlineEditableText
                    value={exp.role}
                    onChange={(role) => updateExperience(index, { role })}
                    placeholder="[Vị trí]"
                    ariaLabel="Vị trí"
                    className="inline-block w-auto"
                  />
                  <span className="text-zinc-500"> @ </span>
                  <span className="text-[var(--cv-primary-color)]">
                    <InlineEditableText
                      value={exp.company}
                      onChange={(company) => updateExperience(index, { company })}
                      placeholder="[Công ty]"
                      ariaLabel="Công ty"
                      className="inline-block w-auto"
                    />
                  </span>
                </div>
                <div className={`whitespace-nowrap ${META_TEXT_CLASS}`}>
                  <InlineEditableText
                    value={exp.startDate}
                    onChange={(startDate) => updateExperience(index, { startDate })}
                    placeholder="MM/YYYY"
                    ariaLabel="Ngày bắt đầu"
                    className="inline-block w-auto"
                  />
                  <span> – </span>
                  <InlineEditableText
                    value={exp.endDate ?? ''}
                    onChange={(endDate) =>
                      updateExperience(index, { endDate: endDate || undefined })
                    }
                    placeholder="Hiện tại"
                    ariaLabel="Ngày kết thúc"
                    className="inline-block w-auto"
                  />
                </div>
              </div>
              <div className="mt-1 text-[0.95em]">
                <InlineEditableText
                  type="textarea"
                  value={exp.description ?? ''}
                  onChange={(description) =>
                    updateExperience(index, { description })
                  }
                  placeholder="Mô tả công việc, thành tựu nổi bật..."
                  ariaLabel="Mô tả công việc"
                />
              </div>
              <div className={`mt-1 ${META_TEXT_CLASS}`}>
                <span className="font-medium">Công nghệ: </span>
                <InlineEditableText
                  value={joinList(exp.tech ?? [])}
                  onChange={(raw) => {
                    const tech = raw
                      .split(',')
                      .map((s) => s.trim())
                      .filter((s) => s.length > 0);
                    updateExperience(index, { tech });
                  }}
                  placeholder="React, Node.js, PostgreSQL"
                  ariaLabel="Công nghệ"
                  className="inline-block w-auto"
                />
              </div>
            </div>
          </BlockOverlay>
        ))}
      </section>

      {/* ----------------------------- Education ---------------------------- */}
      <section
        id="cv-section-education"
        className={SECTION_WRAPPER_CLASS}
        aria-label="Học vấn"
      >
        <h2 className={SECTION_HEADING_CLASS}>Học vấn</h2>
        {data.education.map((edu, index) => (
          <BlockOverlay
            key={index}
            ariaLabel={`Học vấn ${index + 1}`}
            canMoveUp={index > 0}
            canMoveDown={index < data.education.length - 1}
            onMoveUp={() => handleReorder('education', index, 'up')}
            onMoveDown={() => handleReorder('education', index, 'down')}
            onDelete={() => handleDelete('education', index)}
          >
            <div className={ENTRY_WRAPPER_CLASS}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <div className="font-semibold">
                  <span className="text-[var(--cv-primary-color)]">
                    <InlineEditableText
                      value={edu.school}
                      onChange={(school) => updateEducation(index, { school })}
                      placeholder="[Trường / Đại học]"
                      ariaLabel="Trường"
                      className="inline-block w-auto"
                    />
                  </span>
                </div>
                <div className={`whitespace-nowrap ${META_TEXT_CLASS}`}>
                  <InlineEditableText
                    value={edu.startDate ?? ''}
                    onChange={(startDate) =>
                      updateEducation(index, { startDate: startDate || undefined })
                    }
                    placeholder="MM/YYYY"
                    ariaLabel="Ngày bắt đầu"
                    className="inline-block w-auto"
                  />
                  <span> – </span>
                  <InlineEditableText
                    value={edu.endDate ?? ''}
                    onChange={(endDate) =>
                      updateEducation(index, { endDate: endDate || undefined })
                    }
                    placeholder="MM/YYYY"
                    ariaLabel="Ngày kết thúc"
                    className="inline-block w-auto"
                  />
                </div>
              </div>
              <div className={`mt-1 ${META_TEXT_CLASS}`}>
                <InlineEditableText
                  value={edu.degree}
                  onChange={(degree) => updateEducation(index, { degree })}
                  placeholder="[Bằng cấp]"
                  ariaLabel="Bằng cấp"
                  className="inline-block w-auto"
                />
                <span> · </span>
                <InlineEditableText
                  value={edu.field ?? ''}
                  onChange={(field) =>
                    updateEducation(index, { field: field || undefined })
                  }
                  placeholder="Chuyên ngành"
                  ariaLabel="Chuyên ngành"
                  className="inline-block w-auto"
                />
                <span> · GPA </span>
                <InlineEditableText
                  value={edu.gpa ?? ''}
                  onChange={(gpa) =>
                    updateEducation(index, { gpa: gpa || undefined })
                  }
                  placeholder="3.5/4.0"
                  ariaLabel="GPA"
                  className="inline-block w-auto"
                />
              </div>
            </div>
          </BlockOverlay>
        ))}
      </section>

      {/* ------------------------------- Skills ----------------------------- */}
      <section
        id="cv-section-skills"
        className={SECTION_WRAPPER_CLASS}
        aria-label="Kỹ năng"
      >
        <h2 className={SECTION_HEADING_CLASS}>Kỹ năng</h2>
        <div className="text-[0.95em]">
          <InlineEditableText
            type="textarea"
            value={joinList(data.skills)}
            onChange={(raw) => replaceStringList('skills', raw)}
            placeholder="React, TypeScript, Node.js, SQL..."
            ariaLabel="Danh sách kỹ năng"
          />
        </div>
      </section>

      {/* ------------------------------ Projects ---------------------------- */}
      <section
        id="cv-section-projects"
        className={SECTION_WRAPPER_CLASS}
        aria-label="Dự án"
      >
        <h2 className={SECTION_HEADING_CLASS}>Dự án</h2>
        {data.projects.map((proj, index) => (
          <BlockOverlay
            key={index}
            ariaLabel={`Dự án ${index + 1}`}
            canMoveUp={index > 0}
            canMoveDown={index < data.projects.length - 1}
            onMoveUp={() => handleReorder('projects', index, 'up')}
            onMoveDown={() => handleReorder('projects', index, 'down')}
            onDelete={() => handleDelete('projects', index)}
          >
            <div className={ENTRY_WRAPPER_CLASS}>
              <div className="font-semibold text-[var(--cv-primary-color)]">
                <InlineEditableText
                  value={proj.name}
                  onChange={(name) => updateProject(index, { name })}
                  placeholder="[Tên dự án]"
                  ariaLabel="Tên dự án"
                  className="inline-block w-auto"
                />
              </div>
              <div className="mt-1 text-[0.95em]">
                <InlineEditableText
                  type="textarea"
                  value={proj.description ?? ''}
                  onChange={(description) =>
                    updateProject(index, { description })
                  }
                  placeholder="Mô tả ngắn gọn về dự án, vai trò của bạn..."
                  ariaLabel="Mô tả dự án"
                />
              </div>
              <div className={`mt-1 ${META_TEXT_CLASS}`}>
                <span className="font-medium">Công nghệ: </span>
                <InlineEditableText
                  value={joinList(proj.tech ?? [])}
                  onChange={(raw) => {
                    const tech = raw
                      .split(',')
                      .map((s) => s.trim())
                      .filter((s) => s.length > 0);
                    updateProject(index, { tech });
                  }}
                  placeholder="Next.js, Prisma, PostgreSQL"
                  ariaLabel="Công nghệ dự án"
                  className="inline-block w-auto"
                />
              </div>
            </div>
          </BlockOverlay>
        ))}
      </section>

      {/* --------------------------- Certifications ------------------------- */}
      <section
        id="cv-section-certifications"
        className={SECTION_WRAPPER_CLASS}
        aria-label="Chứng chỉ"
      >
        <h2 className={SECTION_HEADING_CLASS}>Chứng chỉ</h2>
        <div className="text-[0.95em]">
          <InlineEditableText
            type="textarea"
            value={joinList(data.certifications)}
            onChange={(raw) => replaceStringList('certifications', raw)}
            placeholder="AWS Certified Developer, Google Cloud Associate..."
            ariaLabel="Danh sách chứng chỉ"
          />
        </div>
      </section>

      {/* ----------------------------- Languages ---------------------------- */}
      <section
        id="cv-section-languages"
        className={SECTION_WRAPPER_CLASS}
        aria-label="Ngôn ngữ"
      >
        <h2 className={SECTION_HEADING_CLASS}>Ngôn ngữ</h2>
        <div className="text-[0.95em]">
          <InlineEditableText
            type="textarea"
            value={joinList(data.languages)}
            onChange={(raw) => replaceStringList('languages', raw)}
            placeholder="Tiếng Việt (bản ngữ), Tiếng Anh (TOEIC 800)..."
            ariaLabel="Danh sách ngôn ngữ"
          />
        </div>
      </section>
    </div>
  );
});
