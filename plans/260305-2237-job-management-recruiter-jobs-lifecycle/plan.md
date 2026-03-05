---
title: "Job Management Plan (Recruiter CRUD + Lifecycle + Job Pages)"
description: "Implement jobs API CRUD, publish/close transitions, recruiter job pages, and public/candidate job listing-detail flow."
status: in_progress
priority: P1
effort: 14h
issue: null
branch: main
tags: [feature, backend, frontend, jobs, rbac]
created: 2026-03-05
---

# Job Management Plan (Recruiter CRUD + Lifecycle + Job Pages)

## Overview

Feature tie to checklist Day 8-9: jobs CRUD API, status transitions, job form, job list, and job detail pages.
Scope MVP only, localhost only, no advanced rich editor plugins.

## Phases

| # | Phase | Status | Effort | Link |
|---|-------|--------|--------|------|
| 1 | Job contract and lifecycle matrix baseline | Completed | 2h | [phase-01](./phase-01-job-contract-and-lifecycle-matrix-baseline.md) |
| 2 | API jobs CRUD and scoped listing | Completed | 4h | [phase-02](./phase-02-api-jobs-crud-and-scoped-listing.md) |
| 3 | API lifecycle transitions and slug hardening | Completed | 2h | [phase-03](./phase-03-api-lifecycle-transitions-and-slug-hardening.md) |
| 4 | Web recruiter job pages and public job browsing | Completed | 4h | [phase-04](./phase-04-web-recruiter-job-pages-and-public-job-browsing.md) |
| 5 | Testing and hardening | In Progress | 2h | [phase-05](./phase-05-testing-and-hardening.md) |

## Dependencies

- Phase 2 depends on Phase 1.
- Phase 3 depends on Phase 2.
- Phase 4 depends on Phases 2-3.
- Phase 5 depends on Phases 2-4.

## Definition Of Done

- Recruiter can create/read/update/soft-delete own jobs.
- Job status transitions enforced: `DRAFT -> PUBLISHED -> CLOSED`.
- `GET /jobs` supports public published jobs and recruiter own jobs (all statuses).
- Web has recruiter job form/list/detail pages plus public/candidate job list/detail pages.
- API and web lint/test/build pass for touched modules.

## Risks

- Slug collisions under concurrent create/update.
- Incorrect role/data scope may leak recruiter private drafts.
- Invalid state transitions can corrupt job lifecycle.

## Mitigation

- Generate unique slugs with suffix fallback and unique-constraint handling.
- Enforce ownership + role checks server-side for every mutable route.
- Add explicit transition guard rules with clear `400`/`403`/`404` responses.

## Unresolved Questions

- Manual browser smoke run for recruiter/public jobs flow is pending.
