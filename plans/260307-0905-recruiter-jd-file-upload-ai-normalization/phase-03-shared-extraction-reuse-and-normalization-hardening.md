# Phase 2: Shared Extraction Reuse And Normalization Hardening

## Context Links

- [Plan Overview](./plan.md)
- [Phase 2](./phase-02-backend-jd-upload-endpoint-and-draft-job-creation.md)
- [CV Text Extractor](../../apps/api/src/cvs/services/cv-text-extractor.service.ts)
- [CV Storage Service](../../apps/api/src/cvs/services/cv-storage.service.ts)
- [AI Normalization Service](../../apps/api/src/normalization/ai-normalization.service.ts)

## Overview

**Priority:** P1  
**Status:** Complete  
**Estimate:** 3h  
**Completed:** 2026-03-07

Prevent duplicate parser pipelines. This phase either shares or cleanly parallels file extraction/storage helpers while keeping `AiNormalizationService.normalizeJob` as the only JD normalization path.

## Key Insights

- The repo already has CV-specific helpers for extraction and storage; blind copy-paste into Jobs will create two maintenance paths.
- JD upload and CV upload need the same document primitives, but not the same domain mapping.
- Current normalization service already supports job domain and shared schema v1.

## Requirements

### Functional

- Decide whether to extract shared document helpers or create thin wrappers over existing CV logic.
- Add explicit recruiter-facing fallback/manual-review messaging.
- Ensure parse telemetry remains available for UI and tests.

### Non-Functional

- Avoid changing `candidate_job_profile_v1`.
- Avoid changing matching extraction path.
- Keep helper abstractions small and justified.

## Architecture

```text
Document helper layer
  -> validate supported upload
  -> extract PDF/DOCX text
  -> save/remove file

Domain layer
  -> CV uses normalizeCv
  -> Job upload uses normalizeJob
```

## Related Code Files

### Files To Modify

- `apps/api/src/cvs/services/cv-text-extractor.service.ts`
- `apps/api/src/cvs/services/cv-storage.service.ts`
- `apps/api/src/jobs/jobs.service.ts`
- `apps/api/src/normalization/ai-normalization.service.ts`

### Files To Create

- Shared helper files only if duplication becomes material.

### Files To Delete

- None.

## Implementation Steps

1. Compare CV helper responsibilities with JD upload needs.
2. Extract shared document utilities only if both domains can use them without leaking domain-specific behavior.
3. Lock the reuse strategy before the upload endpoint is implemented, so backend work does not start from duplicated helpers.
4. Keep `normalizeJob` prompt/normalizer as the sole source for JD structured output.
5. Add clearer fallback/manual-review reason strings for recruiter-facing flows.
6. Ensure telemetry surfaces enough context for UI badges and tests.

## Todo List

- [x] Extraction/storage reuse strategy chosen.
- [x] No copy-pasted JD-only parser stack introduced.
- [x] Fallback/manual-review semantics clarified.
- [x] Telemetry remains stable.

## Success Criteria

- CV and JD uploads share the same document-quality bar.
- Backend stays maintainable and does not fork document handling logic unnecessarily.

## Risk Assessment

- **Risk:** Over-abstracting shared helpers adds complexity for little gain.
- **Mitigation:** Only extract the document primitives, not domain mapping.

- **Risk:** Recruiter fallback flow feels opaque.
- **Mitigation:** Standardize parse status and fallback reasons before UI integration.

## Security Considerations

- Shared helpers must not weaken current CV validation rules.
- Any provenance info added to telemetry must avoid leaking internal storage details.

## Next Steps

- Wire the frontend so recruiters can upload, inspect parse status, and manually correct the draft before publish.

## Unresolved Questions

- None if Phase 1 metadata decision is accepted.