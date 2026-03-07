# Phase 3: Domain Instrumentation - Jobs, CVs, Normalization, Documents, And Prisma

## Context Links

- Jobs flow: `apps/api/src/jobs/jobs.service.ts`, `apps/api/src/jobs/jobs.controller.ts`
- CV flow: `apps/api/src/cvs/cvs.service.ts`
- AI normalization: `apps/api/src/normalization/ai-normalization.service.ts`, `apps/api/src/normalization/normalization.errors.ts`
- Persistence and DB lifecycle: `apps/api/src/prisma/prisma.service.ts`
- Document extraction/storage: `apps/api/src/documents/**`

## Overview

- Priority: P1
- Status: Planned
- Brief: replace ad hoc logging and exception shaping in high-value backend flows with structured, consistent instrumentation tied to the shared contract.

## Key Insights

- `JobsService.createFromFile()` already logs upload failures, but the log is string-only and does not guarantee enough context to explain partial success or cleanup issues.
- `CvsService.buildNormalizedCvData()` already distinguishes parse vs service-unavailable, but returned payloads remain minimal and logs are sparse.
- `AiNormalizationService` currently logs only a warning string when provider calls fail; missing context includes domain, provider/model, request id, and latency boundaries for failures.

## Requirements

### Functional Requirements

- Instrument upload/parse/save flows with start, outcome, and cleanup logs.
- Map domain failures to stable backend codes instead of free-form messages only.
- Upgrade Prisma/storage/document extraction failures to safer, more actionable errors.
- Preserve existing successful behavior and rollback semantics.

### Non-Functional Requirements

- Avoid noisy logs for happy paths; use concise success logs on write flows only.
- Keep per-log context predictable and grep-friendly.
- Do not duplicate the same mapping logic in jobs and cvs.

## Architecture

- Shared event shape for write flows:
  - operation name
  - requestId
  - actorId
  - entityType and entityId when known
  - file metadata when relevant
  - provider/model/latency when AI is involved
  - outcome and error code when failed
- Candidate targets for reusable helpers:
  - normalization error mapper
  - Prisma error mapper
  - document operation logger

## Related Code Files

- Modify: `apps/api/src/jobs/jobs.service.ts`
- Modify: `apps/api/src/jobs/jobs.service.spec.ts`
- Modify: `apps/api/src/cvs/cvs.service.ts`
- Modify: `apps/api/src/cvs/cvs.service.spec.ts`
- Modify: `apps/api/src/normalization/ai-normalization.service.ts`
- Modify: `apps/api/src/normalization/normalization.errors.ts`
- Modify: `apps/api/src/prisma/prisma.service.ts`
- Modify: `apps/api/src/documents/**`
- Create: optional shared error-mapper helpers under `apps/api/src/common/errors/`

## Implementation Steps

1. Replace string-only logs in JD and CV upload flows with structured logs tied to request id and entity context.
2. Promote normalization failures to stable app-level codes with explicit parse vs provider vs storage categories.
3. Add cleanup outcome logging so partial success and rollback failure are diagnosable.
4. Normalize Prisma/storage/extractor exceptions into safe backend messages with internal logs preserving technical cause.
5. Add targeted tests for envelope and log-adjacent mapping behavior in upload/save paths.

## Todo List

- [ ] Instrument JD upload start, create success, create failure, and rollback failure.
- [ ] Instrument CV upload and normalization path with the same conventions.
- [ ] Add shared mapper for AI and persistence failures.
- [ ] Extend specs around failure categories and response payload shape.

## Success Criteria

- Backend can explain why an upload failed even when DB write, cleanup, or AI provider behavior partially succeeded.
- JD and CV paths expose the same contract style and error semantics.

## Risk Assessment

- Biggest risk: too many domain-specific codes too early.
- Mitigation: start with a tight taxonomy and grow only when two different recovery actions are truly needed.

## Security Considerations

- Never emit raw normalized payload or source document text in logs.
- If Prisma errors include SQL or connection strings, keep them internal to logs and redact sensitive fragments if needed.

## Next Steps

- Once backend is stable, update FE clients and pages to consume the richer contract directly in Phase 4.
