# Phase 3: JD-Driven CV Parsing Service — Apply-Time LLM Evaluation

## Context Links

- [plan.md](./plan.md)
- [Phase 1 — Schema types](./phase-01-schema-design-jd-contextual-evaluation.md)
- [Current ai-normalization.service.ts](../../apps/api/src/normalization/ai-normalization.service.ts)
- [Current matching.service.ts](../../apps/api/src/matching/matching.service.ts)
- [Matching policy](../../03-matching-policy.md)

## Overview

- **Priority:** P1 — core of the new pipeline
- **Status:** Pending
- **Effort:** 8h

Build the service that, at apply-time, takes CV raw text + JD RequirementsSchemaV2 and produces a `JdContextualEvaluation` via LLM, then runs deterministic scoring.

## Key Insights

- This replaces both `CandidateProfileService.create()` (generic CV profile builder) and the current `SchemaMatchingEvaluatorService.evaluate()` flow.
- The LLM does the heavy lifting: it reads CV text and evaluates **each JD requirement specifically**, returning structured `met/partial/missing` + evidence.
- After LLM returns, the deterministic scorer just does math — no keyword matching, no text similarity.
- LLM prompt design is critical: must be structured enough that output is reliably parseable.

## Requirements

### Functional

- Given (cvRawText, requirementsSchema) → produce JdContextualEvaluation
- LLM output must conform to JdContextualEvaluation schema exactly
- Deterministic scorer takes JdContextualEvaluation → produces MatchingSnapshotV2 with final score
- Score formula: `final_score = 0.85 * skill_score + 0.15 * constraint_score`
- Each requirement weighted by importance level

### Non-Functional

- LLM call timeout: 60s (same as current normalization)
- JSON validation on LLM output, retry-repair once if invalid
- Graceful degradation if LLM fails during apply (throw, don't fake)

## Architecture

### New Service: `JdDrivenEvaluationService`

```
Location: apps/api/src/matching/services/jd-driven-evaluation.service.ts
```

Responsibilities:

1. Build LLM prompt from CV rawText + RequirementsSchemaV2
2. Call configured LLM provider (gemini/openai)
3. Parse + validate LLM JSON output into JdContextualEvaluation
4. Run deterministic scoring → MatchingSnapshotV2

```typescript
@Injectable()
export class JdDrivenEvaluationService {
  constructor(
    private readonly logger: AppLogger,
    private readonly aiNormalizationService: AiNormalizationService,
  ) {}

  async evaluate(input: {
    cvRawText: string;
    requirementsSchema: RequirementsSchemaV2;
  }): Promise<{
    finalScorePercent: number;
    snapshot: MatchingSnapshotV2;
  }> {
    // 1. Build prompt
    // 2. Call LLM
    // 3. Parse response → JdContextualEvaluation
    // 4. Score deterministically
    // 5. Build MatchingSnapshotV2
  }
}
```

### LLM Prompt Design

```text
You are an HR evaluation assistant. Given a job's requirements and a candidate's CV, evaluate how well the candidate meets each requirement.

## Job Requirements Schema
{JSON of RequirementsSchemaV2}

## Candidate CV Text
{raw text from CV}

## Instructions
For each requirement in the schema, determine:
- status: "met" (strong evidence), "partial" (some evidence but incomplete), "missing" (no evidence), "not_applicable" (requirement doesn't apply)
- evidence: 1-3 brief quotes or facts from the CV that support your assessment
- confidence: "high", "medium", or "low"

For each constraint, determine:
- met: true/false
- evidence: brief explanation

Also extract a brief candidate summary.

## Output Format
Return valid JSON matching this exact schema:
{JSON schema of JdContextualEvaluation}
```

### Deterministic Scoring Logic

```typescript
private scoreDeterministically(evaluation: JdContextualEvaluation, schema: RequirementsSchemaV2): {
  skillScore: number;
  constraintScore: number;
  finalScore: number;
} {
  // skill_score: weighted average of requirement evaluations
  let totalWeight = 0;
  let weightedSum = 0;
  for (const reqEval of evaluation.requirementEvaluations) {
    const requirement = schema.requirements.find(r => r.id === reqEval.requirementId);
    if (!requirement || reqEval.status === 'not_applicable') continue;
    const weight = IMPORTANCE_WEIGHTS[requirement.importance];
    const score = statusScore(reqEval.status); // met=100, partial=55, missing=0
    totalWeight += weight;
    weightedSum += weight * score;
  }
  const skillScore = totalWeight > 0 ? weightedSum / totalWeight : 100;

  // constraint_score: % of required constraints met
  const requiredConstraints = evaluation.constraintEvaluations.filter(
    (c, i) => schema.constraints[i]?.required
  );
  const constraintScore = requiredConstraints.length > 0
    ? (requiredConstraints.filter(c => c.met).length / requiredConstraints.length) * 100
    : 100;

  // final: 0.85 * skill + 0.15 * constraint (from matching policy)
  const finalScore = Math.round(0.85 * skillScore + 0.15 * constraintScore);

  return { skillScore: Math.round(skillScore), constraintScore: Math.round(constraintScore), finalScore };
}
```

### Integration with AiNormalizationService

Add new method to `AiNormalizationService`:

```typescript
async evaluateCvAgainstJd(
  cvRawText: string,
  requirementsSchemaJson: string,
): Promise<JdContextualEvaluation> {
  // Similar to normalize() but with JD-contextual prompt
  // Uses same LLM client, timeout, retry-repair logic
}
```

Or create separate service — depends on code complexity. Recommend: new method on existing service to reuse LLM client infrastructure.

## Related Code Files

### Files to CREATE:

- `apps/api/src/matching/services/jd-driven-evaluation.service.ts` — core new service
- `apps/api/src/matching/services/jd-driven-evaluation.service.spec.ts` — unit tests

### Files to MODIFY:

- `apps/api/src/normalization/ai-normalization.service.ts` — add `evaluateCvAgainstJd()` method
- `apps/api/src/matching/matching.module.ts` — register new service
- `apps/api/src/matching/services/job-requirements-schema.service.ts` — add V2 schema creation (evolve from V1)

### Files to NOT MODIFY (yet):

- `apps/api/src/matching/matching.service.ts` — wired in Phase 4
- `apps/api/src/applications/applications.service.ts` — wired in Phase 4

## Implementation Steps

1. **Add `evaluateCvAgainstJd()` to AiNormalizationService**
   - Build JD-contextual prompt with schema + CV text
   - Reuse existing LLM client, timeout, retry-repair
   - Parse and validate output against JdContextualEvaluation schema
   - Add specific validation: every requirementId must match schema, statuses valid

2. **Create `JdDrivenEvaluationService`**
   - Constructor: inject AiNormalizationService, AppLogger
   - `evaluate()` method: orchestrates LLM call + deterministic scoring
   - `scoreDeterministically()` method: weighted scoring per matching policy
   - `buildSnapshot()` method: assemble MatchingSnapshotV2

3. **Add V2 creation to JobRequirementsSchemaService**
   - New `createV2()` method that produces RequirementsSchemaV2
   - Maps from existing JD normalization data
   - Maps V1 `mustHaves` → `requirements` with importance `critical`/`high`
   - Maps V1 `niceToHaves` → `requirements` with importance `medium`/`low`
   - Extracts constraints from education/certification/experience requirements

4. **Register in matching.module.ts**

5. **Write unit tests**
   - Test deterministic scoring with known inputs
   - Test prompt building
   - Test LLM output validation
   - Test error handling (LLM failure, invalid JSON, missing requirements)

## Todo List

- [ ] Add `evaluateCvAgainstJd()` to AiNormalizationService
- [ ] Design and implement LLM prompt template
- [ ] Add LLM output validation for JdContextualEvaluation
- [ ] Create `JdDrivenEvaluationService`
- [ ] Implement `scoreDeterministically()` with policy weights
- [ ] Implement `buildSnapshot()` → MatchingSnapshotV2
- [ ] Add `createV2()` to JobRequirementsSchemaService
- [ ] Register new service in matching.module.ts
- [ ] Write unit tests for scoring logic
- [ ] Write unit tests for prompt building
- [ ] Write unit tests for output validation

## Success Criteria

- Given CV text + JD schema → produces valid MatchingSnapshotV2 with score 0-100
- Scoring formula matches policy: `0.85 * skill_score + 0.15 * constraint_score`
- LLM output validated before scoring (reject invalid shape)
- Failed LLM call → throws clean error (no fake scores)
- All unit tests pass
- Build passes

## Risk Assessment

- **High risk**: LLM may return inconsistent JSON. Mitigation: strict validation, retry-repair, structured output instruction.
- **Medium risk**: Prompt quality determines evaluation accuracy. Mitigation: test with diverse CVs/JDs, iterate on prompt.
- **Low risk**: Scoring math is deterministic and unit-testable.

## Security Considerations

- CV raw text sent to external LLM provider — same security model as current normalization
- No PII storage beyond what CV already contains
- LLM output validated before persistence (prevent injection via crafted CV text)

## Next Steps

- Phase 4 wires this service into the application create flow
