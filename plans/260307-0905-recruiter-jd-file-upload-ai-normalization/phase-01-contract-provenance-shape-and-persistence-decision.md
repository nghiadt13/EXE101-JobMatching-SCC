# Phase 1: Contract, Provenance Shape, And Persistence Decision

## Context Links

- [Plan Overview](./plan.md)
- [CV Management Plan](../260305-2213-cv-management-upload-parsing-security/plan.md)
- [Unified Normalization Plan](../260306-0941-unified-ai-normalization-cv-jd-shared-schema/plan.md)
- [Jobs Service](../../apps/api/src/jobs/jobs.service.ts)
- [Normalization Types](../../apps/api/src/normalization/normalization.types.ts)
- [Matching Service](../../apps/api/src/matching/matching.service.ts)

## Overview

**Priority:** P1  
**Status:** Complete  
**Estimate:** 2h  
**Completed:** 2026-03-07

Lock the contract before touching code. This phase decides where JD upload provenance lives, which endpoint shape is exposed, and how the upload path maps into the existing Job model without breaking matching.

## Key Insights

- Current JD normalization already exists, but only from manually composed text.
- Matching depends on `location.__normalization.normalizedProfile`; moving that path now is unnecessary churn.
- CV flow already solves the hard parts for validation, extraction, and fallback semantics.

## Requirements

### Functional

- Define recruiter-only multipart API for JD upload.
- Define how uploaded file metadata is stored for MVP.
- Define how uploaded content populates Job fields and normalization metadata.
- Define parse status semantics for recruiter review.

### Non-Functional

- Avoid Prisma migration unless the benefit is clear and immediate.
- Keep contracts backward-compatible with current web and matching flows.
- Keep MVP scope small enough to ship without queueing or OCR.

## Architecture

```text
Recruiter upload JD file
  -> JobsController multipart endpoint
  -> extraction + normalizeJob
  -> map normalized data into Job fields
  -> persist normalization provenance under location.__normalization
  -> recruiter reviews on existing job detail page
```

## Related Code Files

### Files To Modify

- `apps/api/src/jobs/jobs.controller.ts`
- `apps/api/src/jobs/jobs.service.ts`
- `apps/api/src/jobs/jobs.types.ts`
- `apps/web/lib/jobs-client.ts`

### Files To Create

- None required in this phase unless a dedicated upload DTO or metadata mapper is introduced.

### Files To Delete

- None.

## Implementation Steps

1. Choose endpoint shape: `POST /jobs/upload` is clearer than overloading `POST /jobs`.
2. Define request constraints: recruiter role, single file, PDF/DOCX only, size cap aligned with CV flow unless JD needs a higher ceiling.
3. Define normalization meta extension under `location.__normalization`:
   - `normalizedProfile`
   - `parseStatus`
   - `parseTelemetry`
   - `inputMode: 'manual' | 'file_upload'`
   - `sourceDocument: { fileName, mimeType, fileSize, storedPath? }`
4. Decide exposure rule: provenance metadata remains internal-only in MVP; public `JobView` contract stays minimal.
5. Lock supported file types for MVP to PDF and DOCX only.
6. Decide source-of-truth rule: persisted Job fields remain canonical after upload and after later manual edits.
7. Decide draft creation rule: upload creates a new `DRAFT` job and never auto-publishes.
8. Define preservation rule for later `PATCH /jobs/:id`: existing provenance metadata must survive manual edits.

## Todo List

- [x] Upload endpoint contract finalized.
- [x] Provenance metadata shape finalized.
- [x] Public/private metadata boundary finalized.
- [x] Supported file types fixed to PDF/DOCX.
- [x] Source-of-truth rule documented.
- [x] Provenance preservation rule documented.
- [x] Matching compatibility confirmed.

## Success Criteria

- Team has one agreed contract for JD upload before implementation starts.
- No hidden schema or API ambiguity remains for later phases.

## Risk Assessment

- **Risk:** Provenance metadata grows inside `location` and becomes messy.
- **Mitigation:** Keep the shape narrow and isolate it behind mapper helpers.

- **Risk:** Overloading current create/update flow causes unclear API semantics.
- **Mitigation:** Separate upload endpoint from manual create/update endpoints.

## Security Considerations

- Recruiter ownership must be enforced from JWT, not payload.
- Internal file paths must not be returned to the browser unless product explicitly needs downloads.

## Next Steps

- Implement the backend upload endpoint and draft job persistence path from the approved contract.

## Unresolved Questions

- None.