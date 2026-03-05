---
title: "User Management Plan (Admin CRUD + Profile + RBAC)"
description: "Implement users admin APIs, profile APIs, admin users page, profile page, and RBAC validation."
status: in_progress
priority: P1
effort: 12h
issue: null
branch: main
tags: [feature, backend, frontend, api, auth]
created: 2026-03-05
---

# User Management Plan (Admin CRUD + Profile + RBAC)

## Overview

Feature tie to checklist Day 5: users CRUD for admin, profile APIs, admin users page, profile page, RBAC checks.
Scope MVP only, localhost only, no email/password reset flow.

## Phases

| # | Phase | Status | Effort | Link |
|---|-------|--------|--------|------|
| 1 | Contract and RBAC matrix baseline | Completed | 1.5h | [phase-01](./phase-01-contract-and-rbac-matrix.md) |
| 2 | API users admin CRUD | Completed | 3h | [phase-02](./phase-02-api-users-admin-crud.md) |
| 3 | API profile endpoints | Completed | 2h | [phase-03](./phase-03-api-profile-endpoints.md) |
| 4 | Web admin users and profile pages | Completed | 3h | [phase-04](./phase-04-web-admin-users-and-profile-pages.md) |
| 5 | Testing and hardening | In Progress | 2.5h | [phase-05](./phase-05-testing-and-hardening.md) |

## Dependencies

- Phase 2 depends on Phase 1.
- Phase 3 depends on Phase 1.
- Phase 4 depends on Phases 2-3.
- Phase 5 depends on Phases 2-4.

## Definition Of Done

- Admin can list/get/update/soft-delete users via `/users` APIs with RBAC.
- Logged-in user can view/update own profile via `/profile` APIs.
- Web has admin users list page and profile page connected to APIs.
- RBAC enforced for Admin, Recruiter, Candidate with no role bypass.
- API tests and app build/lint pass for touched apps.

## Risks

- RBAC drift between API route-level guard and web UI assumptions.
- Soft-deleted users accidentally shown in admin list/profile checks.
- Candidate profile update can break if relation missing.

## Mitigation

- Centralize role checks via `RolesGuard` + `@Roles`.
- Filter `deletedAt: null` by default for list/get/profile.
- Guard candidate relation updates and create clear `404`/`400` responses.

## Unresolved Questions

- Manual browser smoke run for admin users/profile pages still pending.
