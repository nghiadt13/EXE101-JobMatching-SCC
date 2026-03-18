export const REQUIREMENTS_SCHEMA_VERSION = 'requirements_schema_v1';
export const CANDIDATE_PROFILE_VERSION = 'candidate_profile_v1';
export const SCHEMA_MATCHING_SNAPSHOT_VERSION = 'schema_v1';

// --- V2 constants ---
export const REQUIREMENTS_SCHEMA_V2 = 'requirements_schema_v2';
export const JD_CONTEXTUAL_EVAL_V1 = 'jd_contextual_eval_v1';
export const MATCHING_SNAPSHOT_V2 = 'matching_snapshot_v2';

export type RequirementCategory =
  | 'skill'
  | 'experience'
  | 'education'
  | 'language'
  | 'location'
  | 'certification'
  | 'general';

export type RequirementImportance = 'must_have' | 'nice_to_have';

export type RequirementStatus =
  | 'met'
  | 'partial'
  | 'missing'
  | 'not_applicable';

export interface RequirementItem {
  id: string;
  label: string;
  category: RequirementCategory;
  importance: RequirementImportance;
  keywords: string[];
  minimumMonths: number | null;
}

export interface LocationPreference {
  city: string;
  country: string;
  remote: boolean;
}

export interface RequirementsSchemaV1 {
  version: typeof REQUIREMENTS_SCHEMA_VERSION;
  roleTitle: string;
  summary: string;
  mustHaves: RequirementItem[];
  niceToHaves: RequirementItem[];
  locationPreference: LocationPreference | null;
  warnings: string[];
}

export interface CandidateExperienceEntry {
  role: string;
  company: string;
  startDate: string | null;
  endDate: string | null;
  tech: string[];
}

export interface CandidateEducationEntry {
  school: string;
  degree: string;
  field: string;
  startDate: string | null;
  endDate: string | null;
}

export interface CandidateProjectEntry {
  name: string;
  description: string;
  tech: string[];
}

export interface CandidateProfileV1 {
  version: typeof CANDIDATE_PROFILE_VERSION;
  headline: string;
  summary: string;
  skills: string[];
  experience: CandidateExperienceEntry[];
  education: CandidateEducationEntry[];
  certifications: string[];
  languages: string[];
  projects: CandidateProjectEntry[];
  location: {
    city: string;
    country: string;
  } | null;
  warnings: string[];
}

export interface SchemaRequirementEvaluation {
  id: string;
  label: string;
  category: RequirementCategory;
  importance: RequirementImportance;
  status: RequirementStatus;
  evidence: string[];
}

// ============================================================
// V2 Types — JD-Contextual Evaluation Pipeline
// V1 types above are unchanged for backward compat.
// ============================================================

/** 5-level importance from matching policy */
export type ImportanceLevel =
  | 'critical'
  | 'high'
  | 'medium'
  | 'low'
  | 'very_low';

/** Weight multipliers aligned with 03-matching-policy.md */
export const IMPORTANCE_WEIGHTS: Record<ImportanceLevel, number> = {
  critical: 1.0,
  high: 0.8,
  medium: 0.5,
  low: 0.3,
  very_low: 0.1,
};

/** Status score mapping for deterministic scoring */
export const STATUS_SCORES: Record<RequirementStatus, number> = {
  met: 100,
  partial: 55,
  missing: 0,
  not_applicable: 0, // excluded from calc, not scored
};

export interface RequirementItemV2 {
  id: string;
  label: string;
  category: RequirementCategory;
  importance: ImportanceLevel;
  keywords: string[];
  minimumMonths: number | null;
}

export interface ConstraintItem {
  id: string;
  label: string;
  type:
    | 'education'
    | 'certification'
    | 'experience_years'
    | 'language'
    | 'location'
    | 'other';
  required: boolean;
}

export interface RequirementsSchemaV2 {
  version: typeof REQUIREMENTS_SCHEMA_V2;
  roleTitle: string;
  summary: string;
  /** Max 20 requirements */
  requirements: RequirementItemV2[];
  /** Max 10 constraints */
  constraints: ConstraintItem[];
  locationPreference: LocationPreference | null;
  warnings: string[];
}

// --- JdContextualEvaluation ---

export type EvaluationConfidence = 'high' | 'medium' | 'low';

export interface RequirementEvaluation {
  requirementId: string;
  label: string;
  importance: ImportanceLevel;
  category: RequirementCategory;
  status: RequirementStatus;
  evidence: string[];
  confidence: EvaluationConfidence;
}

export interface ConstraintEvaluation {
  constraintId: string;
  label: string;
  met: boolean;
  evidence: string;
}

export interface ProjectRelevance {
  totalProjects: number;
  relevantProjects: number;
  /** 0-100 AI-assessed relevance score */
  relevanceScore: number;
  /** 1-3 brief descriptions of most relevant projects */
  highlights: string[];
}

export interface CandidateSummary {
  headline: string;
  totalExperienceMonths: number;
  relevantExperienceMonths: number;
  /** Only skills relevant to this JD */
  skills: string[];
  location: { city: string; country: string } | null;
  /** AI-analyzed project relevance to this JD */
  projectRelevance: ProjectRelevance;
}

export interface JdContextualEvaluation {
  version: typeof JD_CONTEXTUAL_EVAL_V1;
  requirementEvaluations: RequirementEvaluation[];
  constraintEvaluations: ConstraintEvaluation[];
  candidateSummary: CandidateSummary;
  warnings: string[];
}

// --- MatchingSnapshotV2 ---

export interface MatchingSnapshotV2 {
  version: typeof MATCHING_SNAPSHOT_V2;
  scoreBreakdown: {
    skillScore: number;
    constraintScore: number;
    experienceBonus: number;
    projectBonus: number;
    final: number;
  };
  requirements: RequirementEvaluation[];
  constraints: ConstraintEvaluation[];
  candidateSummary: CandidateSummary;
  strengths: string[];
  gaps: string[];
  /** Labels of failed constraints, flagged for HR review */
  constraintsFailed: string[];
  warnings: string[];
}

export interface SchemaMatchingSnapshot {
  version: typeof SCHEMA_MATCHING_SNAPSHOT_VERSION;
  scoreBreakdown: {
    mustHave: number;
    niceToHave: number;
    experience: number;
    education: number;
    language: number;
    location: number;
    final: number;
  };
  requirements: SchemaRequirementEvaluation[];
  strengths: string[];
  gaps: string[];
  warnings: string[];
}
