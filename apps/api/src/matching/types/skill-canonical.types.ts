export type SkillAtomSource =
  | 'cv_parsed'
  | 'cv_manual'
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
