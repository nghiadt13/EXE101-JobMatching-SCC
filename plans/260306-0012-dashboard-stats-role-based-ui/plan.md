---
title: "Dashboard Stats Plan (Role-based API + UI)"
description: "Implement role-based dashboard statistics endpoints and dashboard pages for candidate, recruiter, and admin with loading/error handling."
status: completed
priority: P1
effort: 12h
issue: null
branch: main
tags: [feature, dashboard, stats, ui, role-based]
created: 2026-03-06
---

# Dashboard Stats Plan (Role-based API + UI)

## Overview

Feature tie to checklist Day 13: dashboard stats API and candidate/recruiter/admin dashboard pages.
Scope MVP: compact key metrics only, no advanced analytics charts yet.

## Phases

| # | Phase | Status | Effort | Link |
|---|-------|--------|--------|------|
| 1 | Metrics contract and role visibility matrix | Completed | 2h | [phase-01](./phase-01-dashboard-metrics-contract-and-role-matrix.md) |
| 2 | Dashboard stats API implementation | Completed | 3h | [phase-02](./phase-02-dashboard-stats-api-implementation.md) |
| 3 | Web integration for candidate/recruiter/admin dashboards | Completed | 3h | [phase-03](./phase-03-web-dashboard-role-based-pages-and-cards.md) |
| 4 | UX polish: loading/error states and responsive pass | Completed | 2h | [phase-04](./phase-04-dashboard-ux-polish-loading-error-responsive.md) |
| 5 | Testing, docs sync, and hardening | Completed | 2h | [phase-05](./phase-05-dashboard-testing-docs-and-hardening.md) |

## Dependencies

- Phase 2 depends on Phase 1.
- Phase 3 depends on Phase 2.
- Phase 4 depends on Phase 3.
- Phase 5 depends on Phases 2-4.

## Definition Of Done

- API exposes `GET /dashboard/stats` with role-aware response.
- Candidate dashboard shows at least: total applications, pending/reviewing, interview count.
- Recruiter dashboard shows at least: total jobs, published jobs, total applications, pending review.
- Admin dashboard shows at least: total users, active recruiters, active candidates, total jobs/applications.
- Dashboard pages render stats cards with graceful loading/error states.
- API/web lint + tests + builds pass.

## Risks

- Role leakage from shared endpoint if visibility checks are weak.
- N+1 or expensive count queries on recruiter/admin stats.
- UI drift between dashboard pages due duplicated card rendering logic.

## Mitigation

- Centralize role branching in one dashboard service method.
- Use parallel count queries (`Promise.all`) and indexed where clauses.
- Reuse shared stat-card components in web layer.

## Unresolved Questions

- None.
