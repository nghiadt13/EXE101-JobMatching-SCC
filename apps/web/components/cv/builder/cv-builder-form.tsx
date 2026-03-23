'use client';

import type { CvBuilderData } from '@/types/cv-builder';
import { ProfileSection } from './sections/profile-section';
import { ExperienceSection } from './sections/experience-section';
import { EducationSection } from './sections/education-section';
import { SkillsSection } from './sections/skills-section';
import { ProjectsSection } from './sections/projects-section';
import { ExtrasSection } from './sections/extras-section';

type Props = {
  data: CvBuilderData;
  onChange: (data: CvBuilderData) => void;
  onSave: () => void;
  isSaving: boolean;
};

export function CvBuilderForm({ data, onChange, onSave, isSaving }: Props) {
  return (
    <div className="space-y-4 pb-8">
      <ProfileSection
        data={data.profile}
        onChange={(profile) => onChange({ ...data, profile })}
      />
      <ExperienceSection
        data={data.experience}
        onChange={(experience) => onChange({ ...data, experience })}
      />
      <EducationSection
        data={data.education}
        onChange={(education) => onChange({ ...data, education })}
      />
      <SkillsSection
        data={data.skills}
        onChange={(skills) => onChange({ ...data, skills })}
      />
      <ProjectsSection
        data={data.projects}
        onChange={(projects) => onChange({ ...data, projects })}
      />
      <ExtrasSection
        certifications={data.certifications}
        languages={data.languages}
        onChangeCertifications={(certifications) => onChange({ ...data, certifications })}
        onChangeLanguages={(languages) => onChange({ ...data, languages })}
      />

      <button
        type="button"
        onClick={onSave}
        disabled={isSaving || !data.profile.name.trim()}
        className="mt-6 flex w-full items-center justify-center rounded-2xl bg-linear-to-r from-primary-600 to-primary-500 py-4 text-[15px] font-bold text-white shadow-lg shadow-primary-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary-500/40 active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:active:scale-100"
      >
        {isSaving ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Đang lưu CV...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            Lưu thay đổi
          </span>
        )}
      </button>
    </div>
  );
}
