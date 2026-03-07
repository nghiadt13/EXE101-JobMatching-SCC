# Phase 3: JD Requirements Extraction And Recruiter Upload Flow

## Context Links

- [Plan Overview](./plan.md)
- [Jobs Service](../../apps/api/src/jobs/jobs.service.ts)
- [Recruiter Jobs Page](../../apps/web/app/dashboard/recruiter/jobs/page.tsx)
- [Recruiter Job Detail Page](../../apps/web/app/dashboard/recruiter/jobs/[id]/page.tsx)
- [JD Upload Form](../../apps/web/components/jobs/jd-upload-form.tsx)
- [Recruiter Job Form](../../apps/web/components/jobs/recruiter-job-form.tsx)

## Overview

**Priority:** P1  
**Status:** Complete  
**Estimate:** 6h

Replace JD normalization for matching purposes with extraction into a recruiter-centric requirements schema while keeping the current recruiter upload/edit flow stable.

## Key Insights

- Current JD upload already performs synchronous validate -> extract -> normalize -> persist and returns a draft job. That behavior should stay.
- The biggest change is not transport or auth; it is what gets persisted and what the recruiter reviews.
- Manual job creation currently reconstructs a description string. That can stay temporarily, but matching should read `requirementsSchema`, not `description` or `skills`.

## Requirements

### Functional

- Uploaded JD and manual job save both produce `requirementsSchema_v1`.
- Recruiter can review and edit extracted requirements before publish.
- Existing upload endpoint and synchronous error behavior remain unchanged.

### Non-Functional

- No background queue in the first rollout for recruiter uploads.
- Preserve shared API error envelope and request-id surfacing.

## Requirements Schema Direction

- role title / seniority
- must-have requirements
- nice-to-have requirements
- experience constraints
- education constraints
- language constraints
- location / remote constraints
- optional recruiter notes for scoring exclusions

## Related Code Files

### Files To Modify

- `apps/api/src/jobs/jobs.service.ts`
- `apps/api/src/jobs/dto/create-job.dto.ts`
- `apps/api/src/jobs/dto/update-job.dto.ts`
- `apps/api/src/normalization/ai-normalization.service.ts`
- `apps/web/app/dashboard/recruiter/jobs/page.tsx`
- `apps/web/app/dashboard/recruiter/jobs/[id]/page.tsx`
- `apps/web/components/jobs/jd-upload-form.tsx`
- `apps/web/components/jobs/recruiter-job-form.tsx`
- `apps/web/lib/jobs-client.ts`

### Files To Create

- JD schema mapper/validator service
- shared recruiter review helpers for requirements editing

### Files To Delete Or Replace

- Replace old matching dependence on `description + skills` as JD scoring input
- Remove any UI copy that implies skill list alone drives score

## Implementation Steps

1. Extend JD extraction prompt and validator to emit `requirementsSchema_v1`.
2. Persist schema on upload and manual save.
3. Keep `description` for human-readable posting content, but stop treating it as scorer input.
4. Update recruiter detail screen to preview:
   - must-have requirements
   - nice-to-have requirements
   - experience and location constraints
   - parse warnings
5. Update manual job form so recruiter edits schema fields directly or via adapter-backed form fields.
6. Keep upload synchronous; return parse failure immediately as today.
7. Add optional later hook for admin backfill/re-extract, not recruiter path.

## Todo List

- [ ] JD schema extraction contract implemented.
- [ ] Upload flow still returns draft job synchronously.
- [ ] Recruiter review page renders schema instead of skill-only preview.
- [ ] Manual job save also persists requirements schema.

## Success Criteria

- Recruiter can upload a JD and immediately review structured requirements relevant to scoring.
- Publishing does not depend on TF-IDF text preparation anymore.

## Risk Assessment

- **Risk:** Manual form and uploaded JD form diverge.
- **Mitigation:** one schema mapper for both sources.

## Security Considerations

- Uploaded JD files stay subject to current type/size validation and storage cleanup rules.

## Next Steps

- Build candidate profile extraction to mirror the same schema contract style.

## Unresolved Questions

- None.