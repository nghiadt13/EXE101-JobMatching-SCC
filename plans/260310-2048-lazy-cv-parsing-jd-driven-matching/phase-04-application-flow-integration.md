# Phase 4: Application Flow Integration — Wire New Pipeline

## Context Links

- [plan.md](./plan.md)
- [Phase 2 — CV upload changes](./phase-02-cv-upload-simplification.md)
- [Phase 3 — JD-driven evaluation service](./phase-03-jd-driven-cv-parsing-service.md)
- [Current applications.service.ts](../../apps/api/src/applications/applications.service.ts)
- [Current matching.service.ts](../../apps/api/src/matching/matching.service.ts)

## Overview

- **Priority:** P1
- **Status:** Pending
- **Effort:** 5h

Wire the new JD-driven evaluation pipeline into the application create flow. When candidate clicks "Apply", the system:

1. Loads CV.rawText + Job.requirementsSchema
2. Calls new `JdDrivenEvaluationService` (Phase 3)
3. Persists MatchingSnapshotV2 on the Application

## Key Insights

- Current flow: `ApplicationsService.create()` → `MatchingService.calculateIntegrationPayload()` → reads pre-parsed data → deterministic score
- New flow: same entry point but routing based on JD schema version (V1 legacy or V2 new)
- Must handle: new JD (V2) + new CV (has rawText, no candidateProfile), old JD (V1) + old CV (has candidateProfile), mixed scenarios

## Requirements

### Functional

- Apply with V2 JD → use JD-driven pipeline (LLM at apply-time)
- Apply with V1 JD → use existing pipeline (fallback)
- Apply with CV that has no rawText → extract text from file on-the-fly as fallback
- Error during LLM evaluation → return clear error to candidate (don't silently fail)

### Non-Functional

- Apply endpoint may now take 10-30s for new pipeline (LLM call). Must handle gracefully.
- Consider adding estimated wait time to response if async not implemented

## Architecture

### MatchingService Flow Change

```typescript
// matching.service.ts — calculateForCvAndJob
async calculateForCvAndJob(cvId, jobId, actor): Promise<MatchingResult> {
  const cv = await this.getCvOrThrow(cvId, actor);
  const job = await this.getJobOrThrow(jobId, actor);

  const schemaVersion = this.resolveSchemaVersion(job);

  if (schemaVersion === 'v2') {
    // NEW PIPELINE
    const rawText = await this.getCvRawText(cv);
    const schema = job.requirementsSchema as RequirementsSchemaV2;
    const result = await this.jdDrivenEvaluationService.evaluate({
      cvRawText: rawText,
      requirementsSchema: schema,
    });
    return {
      score: result.finalScorePercent,
      matchingVersion: 'schema_v2',
      warnings: result.snapshot.warnings,
      matchingSnapshot: result.snapshot,
    };
  }

  // LEGACY V1 PIPELINE (existing code)
  const candidateProfile = this.resolveCandidateProfile(cv);
  const requirementsSchema = this.resolveRequirementsSchema(job);
  const evaluation = this.schemaMatchingEvaluator.evaluate(requirementsSchema, candidateProfile);
  // ... existing code
}

// Helper: get raw text, fallback to file extraction
private async getCvRawText(cv: CvRecord): Promise<string> {
  if (cv.rawText) return cv.rawText;
  // Fallback for old CVs: extract from file
  const text = await this.cvTextExtractorService.extractFromPath(cv.filePath);
  return text.slice(0, 50_000);
}
```

### Database Query Change

MatchingService.getCvOrThrow needs to select `rawText` and `filePath`:

```typescript
private async getCvOrThrow(cvId, actor) {
  const cv = await this.prisma.cV.findUnique({
    where: { id: cvId },
    select: {
      id: true,
      candidateId: true,
      skills: true,
      candidateProfile: true,
      parsedData: true,
      rawText: true,        // NEW
      filePath: true,        // NEW (for fallback extraction)
      candidate: { select: { userId: true } },
    },
  });
  // ...
}
```

### Application Create — No Structural Change

`ApplicationsService.create()` already calls `matchingService.calculateIntegrationPayload()` — no changes needed here. The routing happens inside MatchingService.

## Related Code Files

### Files to MODIFY:

- `apps/api/src/matching/matching.service.ts` — add V2 routing, inject JdDrivenEvaluationService
- `apps/api/src/matching/matching.module.ts` — add JdDrivenEvaluationService to providers/imports
- `apps/api/src/matching/matching.types.ts` — extend types if needed

### Files to POTENTIALLY MODIFY:

- `apps/api/src/cvs/services/cv-text-extractor.service.ts` — add `extractFromPath()` if not exists (for fallback)
- `apps/api/src/matching/matching.service.ts` — update CvRecord interface to include rawText, filePath

### Files to NOT MODIFY:

- `apps/api/src/applications/applications.service.ts` — no changes needed (delegates to MatchingService)

## Implementation Steps

1. **Update CvRecord interface in matching.service.ts**
   - Add `rawText: string | null` and `filePath: string`

2. **Update getCvOrThrow select**
   - Add `rawText: true, filePath: true` to select

3. **Add resolveSchemaVersion() helper**
   - Check `job.requirementsSchema.version` → 'v1' or 'v2'

4. **Add getCvRawText() fallback helper**
   - If `cv.rawText` exists → return it
   - Else → extract from file path (for legacy CVs)
   - Cap at 50,000 chars

5. **Modify calculateForCvAndJob()**
   - Add version routing: V2 → new pipeline, V1 → existing
   - V2 path calls `jdDrivenEvaluationService.evaluate()`
   - Returns MatchingResult with `matchingVersion: 'schema_v2'`

6. **Update calculateIntegrationPayload()**
   - Same version routing as calculateForCvAndJob
   - Returns appropriate payload for Application persistence

7. **Inject JdDrivenEvaluationService into MatchingService**

8. **Update matching.module.ts**
   - Import and provide JdDrivenEvaluationService
   - May need to import NormalizationModule for LLM client access

9. **Handle errors**
   - LLM failure during apply → throw ServiceUnavailableException with clear message
   - Invalid LLM output → throw UnprocessableEntityException

10. **Add integration test scenario**
    - Create V2 JD, upload CV (with rawText), apply → check match score persisted

## Todo List

- [ ] Update CvRecord interface
- [ ] Update getCvOrThrow select query
- [ ] Add resolveSchemaVersion() helper
- [ ] Add getCvRawText() helper with fallback
- [ ] Modify calculateForCvAndJob() with V2 routing
- [ ] Update calculateIntegrationPayload()
- [ ] Inject JdDrivenEvaluationService
- [ ] Update matching.module.ts
- [ ] Add error handling for apply-time LLM failures
- [ ] Add extractFromPath() to CvTextExtractorService if missing
- [ ] Integration test: V2 JD + new CV → apply → score
- [ ] Build passes

## Success Criteria

- Apply with V2 JD → new pipeline produces score
- Apply with V1 JD → existing pipeline still works
- Old CVs (no rawText) → fallback text extraction works
- LLM failure → clear error returned to candidate
- No regression in existing application flows
- Build and tests pass

## Risk Assessment

- **High risk**: Apply endpoint latency increases from ~200ms to ~10-30s (LLM call). Mitigation: loading state in Phase 5 frontend, consider async in future.
- **Medium risk**: Fallback text extraction for old CVs may be slow if file is large. Mitigation: cap text at 50K chars.
- **Low risk**: Version routing is clean and testable.

## Security Considerations

- CV raw text sent to LLM during apply — same security model as current parse-on-upload
- No new data exposure beyond what already happens
- Error messages should not leak LLM internal errors to candidate

## Next Steps

- Phase 5 handles frontend loading states and display of new snapshot format
- Phase 6 handles migration and backward compatibility
