---
title: "Application Flow Plan (Apply + Recruiter Review + Status Updates)"
description: "Implement applications module using matching service at apply-time, plus candidate/recruiter listing and status transitions."
status: completed
priority: P1
effort: 14h
issue: null
branch: main
tags: [feature, application, matching, recruiter, candidate]
created: 2026-03-05
---

# Application Flow Plan (Apply + Recruiter Review + Status Updates)

## Overview

Feature tie to checklist Day 12: application creation, score persistence, recruiter status updates, and role-based listing.
Scope MVP: one application per candidate per job, no advanced ranking yet.

## Phases

| # | Phase | Status | Effort | Link |
|---|-------|--------|--------|------|
| 1 | Contract, rules, and status transition baseline | Completed | 2h | [phase-01](./phase-01-application-contract-rules-status-baseline.md) |
| 2 | Applications API core (apply + persistence) | Completed | 3.5h | [phase-02](./phase-02-applications-api-apply-and-persistence.md) |
| 3 | Recruiter operations (list/detail/status update) | Completed | 3h | [phase-03](./phase-03-recruiter-application-review-and-status-updates.md) |
| 4 | Web integration (candidate apply + list views) | Completed | 3h | [phase-04](./phase-04-web-integration-candidate-recruiter-application-views.md) |
| 5 | Testing, hardening, and docs sync | Completed | 2.5h | [phase-05](./phase-05-testing-hardening-and-docs-sync.md) |

## Dependencies

- Phase 2 depends on Phase 1.
- Phase 3 depends on Phase 2.
- Phase 4 depends on Phases 2-3.
- Phase 5 depends on Phases 2-4.

## Definition Of Done

- API exposes:
  - `POST /applications` (candidate apply)
  - `GET /applications` (candidate own or recruiter own jobs)
  - `GET /applications/:id`
  - `PATCH /applications/:id/status` (recruiter of the job)
- Apply flow uses `MatchingService.calculateIntegrationPayload(...)` and persists:
  - `matchScore`
  - `tfidfScore`
  - `skillsScore`
- Unique apply rule enforced: one `(jobId, candidateId)` application.
- Frontend supports apply action and application list for candidate/recruiter.
- API/web lint + tests + builds pass.

## Risks

- Race condition on duplicate apply under concurrent requests.
- Visibility leakage when candidate/recruiter queries foreign applications.
- Status transition drift without explicit guard matrix.

## Mitigation

- Map Prisma unique violation to `409 Conflict` in apply.
- Centralize access checks in `ApplicationsService`.
- Freeze status transition matrix in phase 1 and test it directly.

## Unresolved Questions

- Whether recruiter list should support score sorting in MVP or next phase.
