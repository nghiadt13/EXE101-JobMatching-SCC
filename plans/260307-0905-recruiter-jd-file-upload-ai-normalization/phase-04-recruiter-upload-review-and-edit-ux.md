# Phase 4: Recruiter Upload, Review, And Edit UX

## Context Links

- [Plan Overview](./plan.md)
- [Phase 2](./phase-02-backend-jd-upload-endpoint-and-draft-job-creation.md)
- [Recruiter Jobs Page](../../apps/web/app/dashboard/recruiter/jobs/page.tsx)
- [Recruiter Job Detail Page](../../apps/web/app/dashboard/recruiter/jobs/[id]/page.tsx)
- [Jobs Client](../../apps/web/lib/jobs-client.ts)

## Overview

**Priority:** P1  
**Status:** Complete  
**Estimate:** 5h  
**Completed:** 2026-03-07

Extend the existing recruiter job pages so JD file upload becomes a first-class alternate input path, and parsed output is reviewed on the current edit/detail flow before publish.

## Key Insights

- Current recruiter pages already have the right review surface: create/edit form plus `AI Parsed Preview`.
- The missing piece is an upload entrypoint and clear UX language around what upload does.
- Upload should not hide manual editing; it should accelerate the first draft.

## Requirements

### Functional

- Add JD upload UI on recruiter jobs create page.
- Submit multipart upload to the new backend endpoint.
- Redirect to the created draft Job detail page after successful upload.
- Show parse status, warnings, and recruiter verification guidance.
- Allow the existing manual edit form to refine uploaded data.

### Non-Functional

- Keep manual job creation available.
- Avoid making recruiters guess whether upload replaces or supplements the form.
- Keep server actions/API client simple and aligned with current Next.js patterns.

## Architecture

```text
Recruiter Jobs Page
  -> manual create form
  -> JD upload form

Upload success
  -> redirect to recruiter job detail page
  -> parsed preview + parse status badges
  -> manual corrections via existing update action
```

## Related Code Files

### Files To Modify

- `apps/web/app/dashboard/recruiter/jobs/page.tsx`
- `apps/web/app/dashboard/recruiter/jobs/[id]/page.tsx`
- `apps/web/components/jobs/recruiter-job-form.tsx`
- `apps/web/lib/jobs-client.ts`

### Files To Create

- `apps/web/components/jobs/jd-upload-form.tsx`

### Files To Delete

- None.

## Implementation Steps

1. Add a clear JD upload card or form beside the current manual create form.
2. Add multipart upload client/server action.
3. After upload, redirect to job detail page for review.
4. Expand parsed preview to highlight:
   - parse status
   - fallback/manual review warning
   - parsed title/summary/skills/requirements
5. Add copy that makes the flow explicit: upload creates a new draft, recruiter must verify before publish.
6. Keep manual create/edit flows intact so recruiters can still post without file upload.

## Todo List

- [x] JD upload UI added.
- [x] Upload request wired through jobs client.
- [x] Redirect-to-review flow implemented.
- [x] Parse warnings visible in recruiter UI.
- [x] Manual edit path remains intact.

## Success Criteria

- Recruiter understands upload as draft generation, not auto-publish.
- Uploaded drafts can be corrected and published through existing pages.
- No separate recruiter JD management page is needed for MVP.
- Detail page visibility is sufficient for upload provenance/warnings in MVP; recruiter job list stays unchanged unless later testing proves it inadequate.

## Risk Assessment

- **Risk:** Upload UI competes with manual form and confuses users.
- **Mitigation:** Separate the two entry modes visually and explain the difference in one sentence.

- **Risk:** Parsed preview looks authoritative even when fallback was used.
- **Mitigation:** Show obvious warning copy for `fallback` and `needs_review` statuses.

## Security Considerations

- Preserve auth checks in server actions.
- Avoid exposing internal source metadata beyond safe recruiter-facing fields.

## Next Steps

- Validate the whole flow with unit/integration coverage and update docs for the new recruiter workflow.

## Unresolved Questions

- None.