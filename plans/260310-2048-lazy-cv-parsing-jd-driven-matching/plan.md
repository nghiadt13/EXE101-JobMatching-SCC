---
title: 'Lazy CV Parsing — JD-Driven Matching Pipeline'
description: "Defer CV parsing from upload-time to apply-time, parsing CV against the JD's requirements schema so the candidate profile is JD-contextual."
status: complete
priority: P1
effort: 28h
branch: main
tags: [matching, cv, jd, pipeline, refactor, backend, frontend]
blockedBy: []
blocks: []
created: 2026-03-10
---

# Lazy CV Parsing — JD-Driven Matching Pipeline

## Overview

**Problem:** Current pipeline parses CV at upload-time into a generic `candidateProfile` that is JD-agnostic. This means:

- CV parsing wastes LLM calls if candidate never applies
- The candidate profile doesn't adapt to what the JD actually cares about
- Skills/evidence extraction is generic, not targeted to the job's requirement categories

**Solution:** Defer CV parsing from upload to apply-time. When a candidate applies:

1. Read the JD's `requirementsSchema` (already persisted on Job)
2. Send raw CV text + JD requirements schema to LLM → produce a **JD-contextual candidate evaluation**
3. Run deterministic scoring on that evaluation

**Key Behavior Change:**

- CV upload → store file only, extract raw text, basic metadata. No LLM call.
- Apply to JD → LLM parses CV text against JD schema → produces targeted evaluation → deterministic score

## Cross-Plan Dependencies

| Relationship | Plan                                                                                                                            | Status      |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| Follows      | [260307-1841-schema-based-matching-pipeline-migration](../260307-1841-schema-based-matching-pipeline-migration/plan.md)         | complete    |
| Related      | [260306-0941-unified-ai-normalization-cv-jd-shared-schema](../260306-0941-unified-ai-normalization-cv-jd-shared-schema/plan.md) | in_progress |

## Phases

| #   | Phase                                                                                                     | Status | Effort | Link |
| --- | --------------------------------------------------------------------------------------------------------- | ------ | ------ | ---- |
| 1   | [Schema Design — JD-Contextual Evaluation Contract](./phase-01-schema-design-jd-contextual-evaluation.md) | Done   | 5h     |
| 2   | [CV Upload Simplification — Remove Parse-on-Upload](./phase-02-cv-upload-simplification.md)               | Done   | 4h     |
| 3   | [JD-Driven CV Parsing Service — Apply-Time LLM Evaluation](./phase-03-jd-driven-cv-parsing-service.md)    | Done   | 8h     |
| 4   | [Application Flow Integration — Wire New Pipeline](./phase-04-application-flow-integration.md)            | Done   | 5h     |
| 5   | [Frontend Adaptation — CV Upload UX and Application Display](./phase-05-frontend-adaptation.md)           | Done   | 4h     |
| 6   | [Migration, Backward Compat, and Validation](./phase-06-migration-backward-compat-validation.md)          | Done   | 2h     |

## Dependencies

- Phase 2 independent of Phase 1 (can parallel)
- Phase 3 depends on Phase 1
- Phase 4 depends on Phases 2, 3
- Phase 5 depends on Phases 2, 4
- Phase 6 depends on all previous phases

## Target Architecture

```text
JD Upload/Edit (UNCHANGED)
  → LLM structured extraction
  → RequirementsSchemaV2
  → persist on Job

CV Upload (SIMPLIFIED)
  → extract raw text from PDF/DOCX
  → store file + raw text
  → NO LLM call
  → persist rawText on CV

Application Create (NEW PIPELINE)
  → load CV.rawText + Job.requirementsSchema
  → LLM: parse CV against JD schema
  → produce JdContextualEvaluation
  → DeterministicScorer
  → matchScore + snapshot
  → persist on Application
```

## RequirementsSchemaV2 — Proposed JD Schema

Evolves from current `RequirementsSchemaV1`. The JD schema defines **what to evaluate**, and the CV is parsed **against** this schema.

```typescript
interface RequirementsSchemaV2 {
  version: 'requirements_schema_v2';
  roleTitle: string;
  summary: string;

  // Structured requirements with weight levels
  requirements: RequirementItemV2[];

  // Hard constraints (auto-fail if not met, but flagged for HR review, not auto-dropped)
  constraints: ConstraintItem[];

  locationPreference: LocationPreference | null;
  warnings: string[];
}

interface RequirementItemV2 {
  id: string;
  label: string; // "3+ years TypeScript/Node.js backend"
  category: RequirementCategory; // skill | experience | education | language | certification | general
  importance: 'critical' | 'high' | 'medium' | 'low' | 'very_low'; // 5-level weight from matching policy
  keywords: string[]; // ["typescript", "node.js", "backend"]
  minimumMonths: number | null; // 36 (for experience requirements)
}

interface ConstraintItem {
  id: string;
  label: string; // "Bachelor's degree in CS or equivalent"
  type:
    | 'education'
    | 'certification'
    | 'experience_years'
    | 'language'
    | 'location'
    | 'other';
  required: boolean; // true = hard constraint
}

type RequirementCategory =
  | 'skill'
  | 'experience'
  | 'education'
  | 'language'
  | 'location'
  | 'certification'
  | 'general';
```

### Key Changes from V1:

- `mustHaves` / `niceToHaves` → unified `requirements[]` with 5-level `importance` weight (matching policy: `critical`, `high`, `medium`, `low`, `very_low`)
- New `constraints[]` for hard constraints (education, min years, certifications) — mapped to `constraint_score`
- Weight levels align with `03-matching-policy.md`

## JdContextualEvaluation — CV Parsed Against JD

When candidate applies, LLM receives CV raw text + JD requirements and produces:

```typescript
interface JdContextualEvaluation {
  version: 'jd_contextual_eval_v1';

  // For each JD requirement, LLM evaluates if CV satisfies it
  requirementEvaluations: RequirementEvaluation[];

  // For each constraint, LLM checks if met
  constraintEvaluations: ConstraintEvaluation[];

  // Extracted candidate metadata (lightweight, JD-relevant only)
  candidateSummary: {
    headline: string;
    totalExperienceMonths: number;
    relevantExperienceMonths: number;
    skills: string[]; // Only skills relevant to this JD
    location: { city: string; country: string } | null;
  };

  warnings: string[];
}

interface RequirementEvaluation {
  requirementId: string; // Maps back to RequirementItemV2.id
  status: 'met' | 'partial' | 'missing' | 'not_applicable';
  evidence: string[]; // ["Senior Developer at Tech Corp, 2021-2025 (4 years)"]
  confidence: 'high' | 'medium' | 'low';
}

interface ConstraintEvaluation {
  constraintId: string; // Maps back to ConstraintItem.id
  met: boolean;
  evidence: string;
}
```

### LLM Prompt Strategy

The LLM prompt sends:

1. The JD's `RequirementsSchemaV2` (structured JSON)
2. The CV raw text
3. Instruction: "For each requirement, determine if this candidate meets it. Provide evidence."

This is fundamentally different from current approach: instead of generic CV parsing, the LLM evaluates the CV **in context of specific JD requirements**.

## Scoring Pipeline (Post-LLM)

After LLM returns `JdContextualEvaluation`, deterministic scorer runs:

```
skill_score = weighted average of requirementEvaluations
  - Each requirement's weight maps from importance level:
    critical → 1.0, high → 0.8, medium → 0.5, low → 0.3, very_low → 0.1
  - Status score: met → 100, partial → 55, missing → 0, not_applicable → skip

constraint_score = % of constraints met
  - Failed constraints don't auto-drop, but flag for HR review

final_score = 0.85 * skill_score + 0.15 * constraint_score
```

Aligns with `03-matching-policy.md` policy structure.

## Most Relevant Existing Files

Backend:

- `apps/api/prisma/schema.prisma`
- `apps/api/src/cvs/cvs.service.ts` — major changes
- `apps/api/src/matching/matching.service.ts` — major changes
- `apps/api/src/matching/services/schema-matching-evaluator.service.ts` — replace/evolve
- `apps/api/src/matching/services/candidate-profile.service.ts` — deprecate
- `apps/api/src/matching/services/job-requirements-schema.service.ts` — evolve to V2
- `apps/api/src/matching/types/schema-matching.types.ts` — new types
- `apps/api/src/normalization/ai-normalization.service.ts` — new JD-contextual method
- `apps/api/src/applications/applications.service.ts` — wire new pipeline

Frontend:

- `apps/web/components/cv/cv-upload-form.tsx` — simplify (no parse status)
- `apps/web/components/cv/cv-list.tsx` — adjust display
- `apps/web/components/applications/recruiter-applications-table.tsx` — show new evaluation breakdown
- `apps/web/components/applications/candidate-applications-table.tsx`

## Definition Of Done

- CV upload stores file + raw text only, no LLM call
- Apply triggers JD-contextual CV parsing via LLM
- JD schema uses RequirementsSchemaV2 with 5-level importance weights
- Scoring follows matching policy: `final_score = 0.85 * skill_score + 0.15 * constraint_score`
- Failed constraints flagged for HR review, not auto-dropped
- Frontend shows requirement-level breakdown with evidence
- Existing applications remain viewable (backward compat for old snapshots)
- Builds, lints, tests pass

## Biggest Risks

1. **Apply-time latency**: LLM call during apply could be slow (5-15s). Mitigation: show loading state, consider async with polling if needed post-MVP.
2. **LLM evaluation quality**: LLM may hallucinate evidence or miss real matches. Mitigation: structured output schema, validation, confidence scores, fallback rules.
3. **Backward compatibility**: Old CVs have candidateProfile, new ones won't. Old applications have old snapshot format. Mitigation: version-aware display, adapter layer.
4. **Raw text storage**: Storing CV raw text increases DB size. Mitigation: cap at 50K chars, consider separate table if needed.

## Success Criteria

- CV upload is faster (no LLM call) — sub-second for file store + text extraction
- Match scores are more accurate (JD-contextual vs generic parsing)
- Recruiter sees evidence tied to their specific JD requirements
- No regression in existing application display/sorting
- HR retains final decision power (constraints flag, not auto-reject)

## Open Questions

1. Should we cache JD-contextual evaluations so re-applying (after CV update) doesn't re-run LLM? → Recommend: no cache for MVP, each apply = fresh evaluation
2. Should raw text extraction happen at upload time or apply time? → Recommend: upload time (cheap, CPU-only), persist `rawText` column on CV
3. V1 → V2 schema migration: should existing JDs get re-parsed? → Recommend: lazy migration, existing JDs use V1 adapter, new JDs get V2
