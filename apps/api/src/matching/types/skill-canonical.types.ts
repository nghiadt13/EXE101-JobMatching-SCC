export type SkillAtomSource =
  | 'cv_parsed'
  | 'cv_manual'
  | 'cv_builder'
  | 'job_parsed'
  | 'job_manual'
  | 'legacy';

export interface SkillAtom {
  raw: string;
  label: string;
  canonical: string;
  group: string | null;
  source: SkillAtomSource;
}
