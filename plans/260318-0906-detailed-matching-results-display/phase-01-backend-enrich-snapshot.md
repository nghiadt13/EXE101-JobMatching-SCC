# Phase 1: Backend — Enrich Snapshot with Labels

## Overview
- **Priority:** High (blocks all frontend work)
- **Status:** Pending
- **Effort:** 30min

Add `label`, `importance`, `category` to `RequirementEvaluation` and `label` to `ConstraintEvaluation` so the frontend can display human-readable requirement details without a separate API call.

## Related Code Files

| Action | File |
|--------|------|
| MODIFY | `apps/api/src/matching/types/schema-matching.types.ts` |
| MODIFY | `apps/api/src/matching/services/jd-driven-evaluation.service.ts` |
| MODIFY | `apps/api/src/normalization/ai-normalization.service.ts` |

## Implementation Steps

### Step 1: Update `RequirementEvaluation` interface

In `schema-matching.types.ts` (line ~168):

```diff
 export interface RequirementEvaluation {
   requirementId: string;
+  label: string;
+  importance: ImportanceLevel;
+  category: RequirementCategory;
   status: RequirementStatus;
   evidence: string[];
   confidence: EvaluationConfidence;
 }
```

### Step 2: Update `ConstraintEvaluation` interface

In `schema-matching.types.ts` (line ~175):

```diff
 export interface ConstraintEvaluation {
   constraintId: string;
+  label: string;
   met: boolean;
   evidence: string;
 }
```

### Step 3: Add defaults in `normalizeJdEvaluation()`

In `ai-normalization.service.ts`, the AI response doesn't include labels. Add empty defaults so TypeScript is happy:

```typescript
// In requirementEvaluations mapping (~line 270):
.map((item) => ({
  requirementId: String(item['requirementId'] ?? ''),
  label: '',                    // populated later by buildSnapshot
  importance: 'medium' as const,
  category: 'general' as const,
  status: ...,
  evidence: ...,
  confidence: ...,
}))

// In constraintEvaluations mapping (~line 307):
.map((item) => ({
  constraintId: String(item['constraintId'] ?? ''),
  label: '',                    // populated later by buildSnapshot
  met: Boolean(item['met']),
  evidence: ...,
}))

// Also in the fill-missing loops (~line 292 and ~line 317):
// Add label/importance/category defaults to the pushed objects
```

### Step 4: Enrich in `buildSnapshot()`

In `jd-driven-evaluation.service.ts`, enrich evaluations before storing in snapshot:

```typescript
// Before building the snapshot return object:
const enrichedRequirements = requirementEvaluations.map((e) => {
  const req = schema.requirements.find((r) => r.id === e.requirementId);
  return {
    ...e,
    label: req?.label ?? e.requirementId,
    importance: req?.importance ?? ('medium' as const),
    category: req?.category ?? ('general' as const),
  };
});

const enrichedConstraints = constraintEvaluations.map((ce) => {
  const con = schema.constraints.find((c) => c.id === ce.constraintId);
  return {
    ...ce,
    label: con?.label ?? ce.constraintId,
  };
});

// Then use enrichedRequirements/enrichedConstraints in the return:
return {
  ...
  requirements: enrichedRequirements,
  constraints: enrichedConstraints,
  ...
};
```

## Todo List

- [ ] Update `RequirementEvaluation` interface with `label`, `importance`, `category`
- [ ] Update `ConstraintEvaluation` interface with `label`
- [ ] Add defaults in `normalizeJdEvaluation()` for both evaluations
- [ ] Enrich evaluations in `buildSnapshot()` using schema data
- [ ] Verify `npx tsc --noEmit` passes

## Success Criteria

- Backend compiles without errors
- `MatchingSnapshotV2` stored in DB includes labels for new applications
- Old code paths (V1 snapshots) unaffected

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Old snapshots in DB don't have labels | Low | Frontend falls back to `requirementId` |
| AI response might include label field | None | We overwrite in `buildSnapshot()` anyway |
