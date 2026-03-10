# Phase 1: Schema Design — JD-Contextual Evaluation Contract

## Context Links

- [plan.md](./plan.md)
- [Current schema types](../../apps/api/src/matching/types/schema-matching.types.ts)
- [Current evaluator](../../apps/api/src/matching/services/schema-matching-evaluator.service.ts)
- [Matching policy](../../03-matching-policy.md)

## Overview

- **Priority:** P1 — all subsequent phases depend on this schema contract
- **Status:** Pending
- **Effort:** 5h

Design the TypeScript types and contracts for:

1. `RequirementsSchemaV2` — evolved JD schema with 5-level weights + constraints
2. `JdContextualEvaluation` — LLM output when CV is parsed against JD
3. `MatchingSnapshotV2` — final persisted result on Application

## Key Insights

- Current V1 splits requirements into `mustHaves[]` / `niceToHaves[]` (binary importance). Policy requires 5 levels: `critical`, `high`, `medium`, `low`, `very_low`.
- Policy splits scoring into `skill_score` (from requirements) + `constraint_score` (from hard constraints). V1 has no explicit constraint concept.
- LLM evaluation output needs to be structured enough for deterministic scoring but flexible enough for diverse JD types.

## Requirements

### Functional

- V2 types must be backward-compatible: code that reads V1 data should not crash
- `RequirementsSchemaV2` must express both skill/experience requirements AND hard constraints
- `JdContextualEvaluation` must map 1:1 to JD requirements (each requirement gets exactly one evaluation)
- Confidence scores on evaluations for transparency

### Non-Functional

- Types must be serializable as JSON (for Prisma `Json` columns)
- No circular references
- Max 20 requirements, 10 constraints (hard cap to control LLM output)

## Architecture

### New types in `schema-matching.types.ts`:

```typescript
// --- V2 Constants ---
export const REQUIREMENTS_SCHEMA_V2 = 'requirements_schema_v2';
export const JD_CONTEXTUAL_EVAL_V1 = 'jd_contextual_eval_v1';
export const MATCHING_SNAPSHOT_V2 = 'matching_snapshot_v2';

// --- Importance levels (from matching policy) ---
export type ImportanceLevel =
  | 'critical'
  | 'high'
  | 'medium'
  | 'low'
  | 'very_low';

export const IMPORTANCE_WEIGHTS: Record<ImportanceLevel, number> = {
  critical: 1.0,
  high: 0.8,
  medium: 0.5,
  low: 0.3,
  very_low: 0.1,
};

// --- RequirementsSchemaV2 ---
export interface RequirementItemV2 {
  id: string;
  label: string;
  category: RequirementCategory; // reuse existing
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
  requirements: RequirementItemV2[];
  constraints: ConstraintItem[];
  locationPreference: LocationPreference | null;
  warnings: string[];
}

// --- JdContextualEvaluation ---
export type EvaluationConfidence = 'high' | 'medium' | 'low';

export interface RequirementEvaluation {
  requirementId: string;
  status: RequirementStatus; // reuse: met | partial | missing | not_applicable
  evidence: string[];
  confidence: EvaluationConfidence;
}

export interface ConstraintEvaluation {
  constraintId: string;
  met: boolean;
  evidence: string;
}

export interface CandidateSummary {
  headline: string;
  totalExperienceMonths: number;
  relevantExperienceMonths: number;
  skills: string[];
  location: { city: string; country: string } | null;
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
    skillScore: number; // weighted requirement satisfaction
    constraintScore: number; // % constraints met
    final: number;
  };
  requirements: RequirementEvaluation[];
  constraints: ConstraintEvaluation[];
  candidateSummary: CandidateSummary;
  strengths: string[];
  gaps: string[];
  constraintsFailed: string[]; // labels of failed constraints for HR flag
  warnings: string[];
}
```

### Version Routing Strategy

```typescript
// In matching.service.ts — resolve schema version
function resolveSchemaVersion(job: JobRecord): 'v1' | 'v2' {
  const schema = readJsonObject(job.requirementsSchema);
  if (schema.version === REQUIREMENTS_SCHEMA_V2) return 'v2';
  return 'v1';
}

// V1 jobs → use current CandidateProfileService + SchemaMatchingEvaluatorService (existing flow)
// V2 jobs → use new JdDrivenEvaluationService (new flow with LLM at apply-time)
```

## Related Code Files

### Files to MODIFY:

- `apps/api/src/matching/types/schema-matching.types.ts` — add V2 types alongside V1
- `apps/api/src/matching/matching.types.ts` — extend MatchingResult if needed

### Files to CREATE:

- None in this phase (types only, added to existing file)

### Files to DELETE:

- None

## Implementation Steps

1. Add V2 constants (`REQUIREMENTS_SCHEMA_V2`, `JD_CONTEXTUAL_EVAL_V1`, `MATCHING_SNAPSHOT_V2`)
2. Add `ImportanceLevel` type and `IMPORTANCE_WEIGHTS` map
3. Add `RequirementItemV2` interface (extends category from existing `RequirementCategory`)
4. Add `ConstraintItem` interface
5. Add `RequirementsSchemaV2` interface
6. Add `RequirementEvaluation`, `ConstraintEvaluation`, `CandidateSummary` interfaces
7. Add `JdContextualEvaluation` interface
8. Add `MatchingSnapshotV2` interface
9. Add version routing helper type
10. Verify existing V1 types are NOT modified (backward compat)
11. Add JSDoc comments explaining relationship between V1 and V2

## Todo List

- [ ] Add V2 type constants
- [ ] Add ImportanceLevel type and weights map
- [ ] Add RequirementItemV2 and ConstraintItem interfaces
- [ ] Add RequirementsSchemaV2 interface
- [ ] Add JdContextualEvaluation + sub-interfaces
- [ ] Add MatchingSnapshotV2 interface
- [ ] Verify V1 types unchanged
- [ ] TypeScript compilation passes

## Success Criteria

- All V2 types compile cleanly alongside V1 types
- `npm run build -w api` passes
- No changes to existing V1 type definitions
- Types are JSON-serializable (no Maps, Sets, functions)

## Risk Assessment

- **Low risk**: This phase is additive (new types only), no runtime changes
- **Watch**: Type naming must be clear enough to avoid confusion between V1/V2 in services

## Security Considerations

- None (type definitions only, no runtime behavior)

## Next Steps

- Phase 3 uses these types for the JD-driven parsing service
- Phase 4 uses MatchingSnapshotV2 for application creation
