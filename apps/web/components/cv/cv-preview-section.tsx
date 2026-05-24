import type { CandidateProfile } from '@/lib/cv-client';

type PreviewSectionProps = {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
};

export function PreviewSection({ icon, title, children }: PreviewSectionProps) {
  return (
    <section className="mb-6">
      <div className="mb-3 flex items-center gap-2 border-b border-md-outline-variant/30 pb-2">
        <span className="text-md-primary">{icon}</span>
        <h4 className="font-label-md text-md-on-surface uppercase tracking-wide">
          {title}
        </h4>
      </div>
      {children}
    </section>
  );
}

function formatDateRange(start: string | null, end: string | null): string {
  const s = start ?? '?';
  const e = end ?? 'Hiện tại';
  return `${s} - ${e}`;
}

export function ProfileHeader({ profile }: { profile: CandidateProfile }) {
  return (
    <section className="mb-6">
      <h3 className="font-headline-md text-md-on-surface">
        {profile.headline}
      </h3>
      {profile.summary && (
        <p className="mt-2 font-body-sm text-md-on-surface-variant">
          {profile.summary}
        </p>
      )}
      {profile.location && (
        <p className="mt-3 text-sm text-md-on-surface-variant">
          {[profile.location.city, profile.location.country]
            .filter(Boolean)
            .join(', ')}
        </p>
      )}
    </section>
  );
}

export function SkillsSection({ skills }: { skills: string[] }) {
  if (skills.length === 0) return null;
  return (
    <PreviewSection
      icon={<span className="text-sm">&#128736;</span>}
      title="Kỹ năng"
    >
      <div className="flex flex-wrap gap-2">
        {skills.map((skill) => (
          <span
            key={skill}
            className="rounded-full bg-md-primary-container px-2.5 py-1 font-label-sm text-md-on-primary"
          >
            {skill}
          </span>
        ))}
      </div>
    </PreviewSection>
  );
}

export function ExperienceSection({
  experience,
}: {
  experience: CandidateProfile['experience'];
}) {
  if (experience.length === 0) return null;
  return (
    <PreviewSection
      icon={<span className="text-sm">&#128188;</span>}
      title="Kinh nghiệm"
    >
      <div className="space-y-3">
        {experience.map((exp, i) => (
          <div key={i} className="rounded-lg bg-md-surface-container-low p-3">
            <p className="font-label-md text-md-on-surface">{exp.role}</p>
            <p className="text-sm text-md-on-surface-variant">{exp.company}</p>
            <p className="mt-1 font-label-sm text-md-outline-variant">
              {formatDateRange(exp.startDate, exp.endDate)}
            </p>
            {exp.tech.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {exp.tech.map((t) => (
                  <span
                    key={t}
                    className="rounded bg-md-surface-container px-1.5 py-0.5 font-label-sm text-md-on-surface-variant"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </PreviewSection>
  );
}

export function EducationSection({
  education,
}: {
  education: CandidateProfile['education'];
}) {
  if (education.length === 0) return null;
  return (
    <PreviewSection
      icon={<span className="text-sm">&#127891;</span>}
      title="Học vấn"
    >
      <div className="space-y-3">
        {education.map((edu, i) => (
          <div key={i} className="rounded-lg bg-md-surface-container-low p-3">
            <p className="font-label-md text-md-on-surface">
              {edu.degree} - {edu.field}
            </p>
            <p className="text-sm text-md-on-surface-variant">{edu.school}</p>
            <p className="mt-1 font-label-sm text-md-outline-variant">
              {formatDateRange(edu.startDate, edu.endDate)}
            </p>
          </div>
        ))}
      </div>
    </PreviewSection>
  );
}

export function ProjectsSection({
  projects,
}: {
  projects: CandidateProfile['projects'];
}) {
  if (projects.length === 0) return null;
  return (
    <PreviewSection
      icon={<span className="text-sm">&#128193;</span>}
      title="Dự án"
    >
      <div className="space-y-3">
        {projects.map((proj, i) => (
          <div key={i} className="rounded-lg bg-md-surface-container-low p-3">
            <p className="font-label-md text-md-on-surface">{proj.name}</p>
            <p className="mt-1 text-sm text-md-on-surface-variant">
              {proj.description}
            </p>
            {proj.tech.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {proj.tech.map((t) => (
                  <span
                    key={t}
                    className="rounded bg-md-surface-container px-1.5 py-0.5 font-label-sm text-md-on-surface-variant"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </PreviewSection>
  );
}
