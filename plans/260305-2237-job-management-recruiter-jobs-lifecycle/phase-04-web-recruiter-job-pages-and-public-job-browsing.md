# Phase 4: Web Recruiter Job Pages And Public Job Browsing

## Context Links

- [Plan Overview](./plan.md)
- [Phase 2](./phase-02-api-jobs-crud-and-scoped-listing.md)
- [Phase 3](./phase-03-api-lifecycle-transitions-and-slug-hardening.md)
- [Recruiter Dashboard](../../apps/web/app/dashboard/recruiter/page.tsx)

## Overview

**Priority:** P1  
**Status:** ✅ Completed  
**Estimate:** 4h

Build recruiter job management UI and public/candidate job browsing pages using new jobs APIs.

## Key Insights

- Existing web uses server actions and thin API client wrappers.
- Recruiter dashboard currently has no jobs entry point.
- Candidate journey later depends on having job list/detail available.

## Requirements

### Functional

- Recruiter dashboard:
  - add jobs entry link
  - create page `/dashboard/recruiter/jobs`
  - add job create form + list own jobs + transition actions
  - add detail/edit page `/dashboard/recruiter/jobs/[id]`
- Public/candidate browsing:
  - create `/jobs` list (published only)
  - create `/jobs/[slug]` detail
- Show status badges (`DRAFT`, `PUBLISHED`, `CLOSED`) and action availability.
- Handle API errors clearly in UI.

### Non-functional

- Role guards on recruiter routes.
- Keep token usage server-side for recruiter actions.
- Reasonable responsive layout for list/form/detail.

## Architecture

```text
RSC pages + server actions
-> jobs-client.ts
-> API /jobs endpoints
```

## Related Code Files

### Files To Modify

- `apps/web/app/dashboard/recruiter/page.tsx`
- `apps/web/components/auth/dashboard-shell.tsx` (if layout updates required)

### Files To Create

- `apps/web/lib/jobs-client.ts`
- `apps/web/app/dashboard/recruiter/jobs/page.tsx`
- `apps/web/app/dashboard/recruiter/jobs/[id]/page.tsx`
- `apps/web/components/jobs/recruiter-job-form.tsx`
- `apps/web/components/jobs/recruiter-jobs-table.tsx`
- `apps/web/components/jobs/recruiter-job-status-actions.tsx`
- `apps/web/app/jobs/page.tsx`
- `apps/web/app/jobs/[slug]/page.tsx`

### Files To Delete

- None.

## Implementation Steps

1. Add `jobs-client` wrappers for CRUD + publish + close endpoints.
2. Build recruiter jobs page with create form and own-jobs table.
3. Add server actions for create/update/delete/publish/close.
4. Build recruiter job detail/edit page.
5. Add public jobs list + slug detail pages.
6. Link recruiter dashboard to jobs management page.

## Todo List

- [ ] Recruiter jobs route and components implemented.
- [ ] Recruiter create/edit/publish/close/delete actions wired.
- [ ] Public jobs list/detail pages implemented.
- [ ] Recruiter dashboard link updated.

## Success Criteria

- [ ] Recruiter can complete job posting lifecycle from web.
- [ ] Candidate/public can browse published jobs.
- [ ] UI states align with backend transition rules.

## Risk Assessment

- **Risk:** route choices conflict with future application flow routes.
- **Mitigation:** keep `/jobs` public and `/dashboard/recruiter/jobs/*` owner-only.

## Security Considerations

- Recruiter actions require authenticated session token.
- Public pages must never fetch recruiter draft/closed jobs.

## Next Steps

- Add automated tests and smoke checklist.

## Unresolved Questions

- None.
