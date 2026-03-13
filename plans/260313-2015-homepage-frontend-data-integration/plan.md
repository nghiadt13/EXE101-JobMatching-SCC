---
title: "Homepage Frontend Data Integration Plan"
description: "Wire homepage UI to real backend APIs and complete production-ready homepage rendering in Next.js."
status: proposed
priority: P1
effort: 18h
branch: main
tags: [frontend, nextjs, homepage, api-integration, auth]
blockedBy: []
blocks: []
created: 2026-03-13
---

# Homepage Frontend Data Integration Plan

## Objective

Complete homepage integration so all dynamic sections load from backend APIs (`/api/home`, `/api/jobs/:id/save`, `/api/notifications/unread-count`) while preserving existing UI design.

## Current State

- Homepage UI is visually converted but still mostly hardcoded in `apps/web/components/home/homepage-main.tsx`.
- Backend contract is available and implemented.
- Demo seed data is available in API for homepage sections.

## In Scope

- Build typed homepage API client in web app.
- Fetch homepage data with optional auth token.
- Replace hardcoded section data with backend data.
- Implement save/unsave interaction for featured jobs.
- Add loading/error/fallback handling.
- Add integration tests for homepage data rendering behavior.

## Out of Scope

- Redesign homepage layout.
- CMS/editor UI for homepage content.
- Personal recommendation model changes.

## Contract Source of Truth

- `docs/HOMEPAGE_BACKEND_HANDOFF_2026-03-13/openapi-homepage-v1.yaml`
- Backend implementation under `apps/api/src/homepage/*`

## Phases

| # | Phase | Effort | Status | Link |
|---|-------|--------|--------|------|
| 1 | Client Contract and Data Layer | 3h | Proposed | [phase-01](./phase-01-client-contract-and-data-layer.md) |
| 2 | SSR/Auth Wiring and Page Composition | 4h | Proposed | [phase-02](./phase-02-ssr-auth-wiring-and-page-composition.md) |
| 3 | UI Binding and Interactive Save/Unsave | 5h | Proposed | [phase-03](./phase-03-ui-binding-and-interactive-save-unsave.md) |
| 4 | Resilience, Loading UX, and Empty States | 3h | Proposed | [phase-04](./phase-04-resilience-loading-and-empty-states.md) |
| 5 | Testing, Telemetry, and Rollout | 3h | Proposed | [phase-05](./phase-05-testing-telemetry-and-rollout.md) |

## Acceptance Criteria

1. Homepage sections render from API payload only (no hardcoded section dataset for dynamic blocks).
2. Guest and authenticated users both render correctly.
3. Save/unsave state updates optimistically and stays consistent after server response.
4. API/network failure degrades gracefully and keeps page usable.
5. Tests validate main homepage data flow and interaction paths.

## Definition of Done

- Phase 1-5 completed and reviewed.
- Homepage works with seeded backend data in local environment.
- No regression in existing web routes.

