# Phase 4: Web Integration (Candidate + Recruiter Application Views)

## Context Links

- [Plan Overview](./plan.md)
- [Phase 2](./phase-02-applications-api-apply-and-persistence.md)
- [Phase 3](./phase-03-recruiter-application-review-and-status-updates.md)
- [Web Jobs Pages](../../apps/web/app/(dashboard)/dashboard/recruiter/jobs)

## Overview

**Priority:** P1  
**Status:** ✅ Completed  
**Estimate:** 3h

Expose application flow in frontend with clear role-based UX.

## Requirements

### Functional

- Candidate:
  - Apply button from job detail page
  - CV selector (primary default)
  - Applications list page with status + score
- Recruiter:
  - Applications list per jobs
  - Update status action with notes
- Build web API client for applications endpoints.

### Non-functional

- Preserve current design system/patterns.
- Show loading/error states for submit/update actions.

## Todo List

- [x] Candidate apply UI done.
- [x] Candidate applications page done.
- [x] Recruiter review/status UI done.

## Unresolved Questions

- Recruiter view is global by default in MVP; `jobId` filter supported by API for job-scoped follow-up.
