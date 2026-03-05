# Phase 1: Gap Audit And Acceptance Contract

## Context Links

- [Plan Overview](./plan.md)
- [Jobs List Page](../../apps/web/app/jobs/page.tsx)
- [Job Detail Page](../../apps/web/app/jobs/[slug]/page.tsx)
- [Application API](../../apps/api/src/applications)

## Overview

**Priority:** P1  
**Status:** ✅ Completed  
**Estimate:** 1.5h

Audit current browse/apply behavior and lock acceptance states before coding.

## Requirements

### Functional

- Define acceptance states for candidate apply UX:
  - not logged in
  - logged in as candidate with CV
  - logged in as candidate with no CV
  - logged in non-candidate
  - duplicate apply
  - successful apply
- Freeze route-level behavior for `/jobs` and `/jobs/[slug]`.

### Non-functional

- Keep scope constrained to candidate discovery + apply entry.
- Avoid introducing new business rules outside current API contract.

## Todo List

- [x] Acceptance states documented.
- [x] Gap list drafted from current implementation.
- [x] Scope lock approved in plan notes.

## Unresolved Questions

- None.
