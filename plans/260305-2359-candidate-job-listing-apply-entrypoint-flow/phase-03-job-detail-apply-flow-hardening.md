# Phase 3: Job Detail Apply Flow Hardening

## Context Links

- [Plan Overview](./plan.md)
- [Phase 2](./phase-02-job-list-candidate-ux-and-apply-entrypoint.md)
- [Job Detail](../../apps/web/app/jobs/[slug]/page.tsx)
- [Apply Form](../../apps/web/components/applications/candidate-apply-form.tsx)

## Overview

**Priority:** P1  
**Status:** ✅ Completed  
**Estimate:** 2h

Harden detail-page apply behavior and user feedback for all candidate states.

## Requirements

### Functional

- Keep apply server action candidate-only.
- Ensure explicit UI feedback for:
  - duplicate apply (409)
  - missing CV / missing input
  - generic apply failure
  - apply success
- Ensure callback/login redirect path returns to the same job detail.

### Non-functional

- No hidden redirects without user-facing reason.
- Keep behavior deterministic with URL query state.

## Files To Modify

- `apps/web/app/jobs/[slug]/page.tsx`
- `apps/web/components/applications/candidate-apply-form.tsx`

## Todo List

- [x] Candidate apply edge cases handled cleanly.
- [x] Redirect and callback behavior verified.
- [x] Apply feedback messages standardized.

## Unresolved Questions

- None.
