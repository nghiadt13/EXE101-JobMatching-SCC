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
        className="w-full rounded-xl bg-primary-600 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-700 hover:shadow disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSaving ? '⏳ Đang lưu...' : '💾 Lưu CV'}
      </button>
    </div>
  );
}
