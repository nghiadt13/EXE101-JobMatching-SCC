# Phase 2: Demo Seed Data Hardening And Scenario Coverage

## Context Links

- [Plan Overview](./plan.md)
- [Phase 1](./phase-01-acceptance-matrix-and-test-scope-lock.md)
- [Prisma Seed](../../apps/api/prisma/seed.ts)
- [Schema](../../apps/api/prisma/schema.prisma)

## Overview

**Priority:** P1  
**Status:** ✅ Completed  
**Estimate:** 3h

Make demo data robust enough to run candidate/recruiter/admin scenarios end-to-end.

## Requirements

### Functional

- Expand seed fixtures for realistic workflow coverage:
  - multiple recruiters and candidates
  - jobs in `DRAFT`, `PUBLISHED`, `CLOSED`
  - applications spanning `APPLIED`, `REVIEWING`, `INTERVIEW`, `OFFER`, `REJECTED`
- Ensure seeded credentials are documented and stable.
- Verify seed output is idempotent and reproducible.

### Non-functional

- Keep seed runtime fast for local demo reset.
- Avoid hard-to-maintain random data generation.

## Files To Modify

- `apps/api/prisma/seed.ts`
- `docs/05-implementation-checklist.md` (if checklist evidence changes)

## Todo List

- [x] Seed fixtures expanded for all demo paths.
- [x] Credentials and scenario mapping documented.
- [x] Seed rerun verification done.

## Unresolved Questions

- None.
