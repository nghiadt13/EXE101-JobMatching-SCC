# Phase 1: Acceptance Matrix And Test Scope Lock

## Context Links

- [Plan Overview](./plan.md)
- [Implementation Checklist](../../docs/05-implementation-checklist.md)
- [Web Smoke Docs](../../apps/web/docs)

## Overview

**Priority:** P1  
**Status:** ✅ Completed  
**Estimate:** 2h

Lock exact scope for Day 14 testing/polish to avoid open-ended QA and context drift.

## Requirements

### Functional

- Define end-to-end acceptance matrix by role:
  - Admin: users + overview controls
  - Recruiter: jobs lifecycle + application review
  - Candidate: profile/cv/apply/dashboard
- Map each matrix item to an existing or new smoke checklist file.
- Freeze command-level validation gates for API/web.

### Non-functional

- Keep scope MVP-focused (no new major features).
- Every acceptance item must have deterministic pass/fail evidence.

## Todo List

- [x] Acceptance matrix drafted.
- [x] Checklist mapping completed.
- [x] Validation command gates locked.

## Unresolved Questions

- None.
