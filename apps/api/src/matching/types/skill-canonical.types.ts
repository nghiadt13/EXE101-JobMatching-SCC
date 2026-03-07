export type SkillAtomSource =
  | 'cv_parsed'
  | 'cv_manual'
  | 'job_parsed'
  | 'job_manual'
  | 'legacy';

export type MatchingVersion = 'legacy' | 'v2';

export interface SkillAtom {
  raw: string;
  label: string;
  canonical: string;
  group: string | null;
  source: SkillAtomSource;
}

export interface MatchingSnapshot {
  version: MatchingVersion;
  componentScores: {
    tfidf: number;
    skills: number;
    final: number;
  };
  topMatchedSkills: string[];
  missingSkills: string[];
  warnings: string[];
}
