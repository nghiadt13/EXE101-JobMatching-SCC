# Phase 4: Web Candidate CV Pages And Actions

## Context Links

- [Plan Overview](./plan.md)
- [Phase 2](./phase-02-api-cv-module-and-file-storage-flow.md)
- [Phase 3](./phase-03-parsing-pipeline-pdf-docx-gemini-normalization.md)
- [Candidate Dashboard](../../apps/web/app/dashboard/candidate/page.tsx)

## Overview

**Priority:** P1  
**Status:** ✅ Completed  
**Estimate:** 3h

Implement candidate CV management UI: upload, list/detail, edit parsed fields, delete, and set primary.

## Key Insights

- Web already uses server actions + typed API clients for profile/users flows.
- Candidate dashboard currently has no CV entry point.
- Auth/session role checks are already established in dashboard pages.
- MVP UI should prioritize workflow clarity over advanced styling.

## Requirements

### Functional

- Add candidate CV page route (recommended: `/dashboard/candidate/cvs`).
- Provide upload form with file picker (PDF/DOCX only) and user-friendly validation errors.
- Show CV list with metadata:
  - file name
  - upload date
  - primary badge
  - parsed skills preview
- Provide actions:
  - set primary
  - delete CV
  - edit parsed fields (skills/summary/basic sections)
- Add link from candidate dashboard to CV page.

### Non-functional

- Enforce candidate-only page access and redirect unauthorized roles.
- Keep API token handling server-side.
- Show clear loading/error states for upload and mutations.

## Architecture

```text
RSC page (/dashboard/candidate/cvs)
  -> server actions (upload/update/delete/set-primary)
  -> cv-client.ts (typed API requests with bearer token)
  -> API /cvs endpoints
```

## Related Code Files

### Files To Modify

- `apps/web/app/dashboard/candidate/page.tsx`
- `apps/web/components/auth/dashboard-shell.tsx` (only if layout updates needed)

### Files To Create

- `apps/web/app/dashboard/candidate/cvs/page.tsx`
- `apps/web/components/cv/cv-upload-form.tsx`
- `apps/web/components/cv/cv-list.tsx`
- `apps/web/components/cv/cv-edit-form.tsx`
- `apps/web/lib/cv-client.ts`

### Files To Delete

- None.

## Implementation Steps

1. Create `cv-client` API wrappers (upload/list/get/update/delete/set-primary).
2. Build candidate CV page with session guard and initial data fetch.
3. Implement upload server action using `FormData`.
4. Build CV list UI with primary indicator and action buttons.
5. Implement edit parsed-data form and update action.
6. Add delete and set-primary actions with optimistic-safe revalidation.
7. Add dashboard link for candidate role.

## Todo List

- [ ] Candidate CV route implemented.
- [ ] Upload flow wired to API.
- [ ] List/detail/edit/delete/set-primary actions implemented.
- [ ] Candidate dashboard link updated.
- [ ] Error/loading states implemented.

## Success Criteria

- [ ] Candidate can complete CV flow without direct API calls.
- [ ] Unauthorized users cannot access candidate CV route.
- [ ] UI reflects primary CV and parsed data updates correctly.

## Risk Assessment

- **Risk:** Multipart upload handling from server action may be inconsistent.
- **Mitigation:** Keep upload request path explicit and validate `FormData` before API call.

- **Risk:** Parsed-data form can send malformed JSON.
- **Mitigation:** Validate and sanitize form fields before request submission.

## Security Considerations

- Never expose backend internal file path in UI.
- Keep bearer token handling on server side only.
- Do not render untrusted parsed text as HTML.

## Next Steps

- Execute tests and hardening for API/UI CV workflows.

## Unresolved Questions

- None.
