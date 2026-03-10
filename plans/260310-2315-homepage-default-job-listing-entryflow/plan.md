---
title: "Homepage as Default Job Listing Entryflow"
description: "Make `/` the default job-listing experience (instead of `/jobs`), align role-based navigation and auth entrypoints, and preserve SEO + backward compatibility."
status: in-progress
priority: P1
effort: 14h
branch: main
tags: [frontend, routing, navigation, seo, auth, jobs]
blockedBy: [260310-2005-homepage-topcv-job-listing-filters]
blocks: []
created: 2026-03-10
---

# Homepage as Default Job Listing Entryflow

## Objective

Make homepage (`/`) the primary and default job-listing surface for all user entry paths, while keeping `/jobs` backward-compatible and avoiding role-flow regressions.

## Why This Plan

Current behavior still treats `/jobs` as the canonical listing route in multiple flows (nav, CTA copy, metadata target, callbacks). This creates fragmented entry points and confusion after shipping TopCV-style homepage.

## Scope

### In scope

- Unify user entry to jobs on `/` (public + authenticated users).
- Keep `/jobs` working, but make it compatibility alias.
- Update role-based nav + CTA labels/targets.
- Preserve apply flow at `/jobs/[slug]` (or define migration if switching slug route later).
- Align SEO canonical/sitemap/internal links to avoid duplicate-content conflict.

### Out of scope

- Rewriting recruiter dashboard IA.
- Changing application domain rules.
- Introducing new recommendation engine/ranking algorithm.

## Current-State Notes

- `/` currently renders TopCV homepage behind `WEB_HOME_TOPCV_V1_ENABLED`.
- `/jobs` still has separate list page and is widely referenced in links and callbacks.
- Previous auth redirect from `/` to role dashboard was removed temporarily for testing.

## Target Behavior

1. `/` is the default job-listing/home discovery page.
2. `/jobs` continues to resolve (301/302 strategy configurable), preserving shared links.
3. Logged-in users are not forcibly redirected away from `/`.
4. Role dashboards remain accessible via explicit navigation/action, not forced on root access.

## Architecture Decisions

- Keep `/jobs/[slug]` detail path in v1 of this migration for safety.
- Introduce route policy:
  - Root listing: `/`
  - Legacy listing alias: `/jobs`
  - Detail: `/jobs/[slug]`
- Add centralized route constants (single source of truth for “public jobs listing route”).

## Phases

| # | Phase | Effort | Status | Link |
|---|-------|--------|--------|------|
| 1 | Routing Contract and Flag Policy | 3h | Completed | [phase-01](./phase-01-routing-contract-and-flag-policy.md) |
| 2 | Navigation and Auth Entryflow Refactor | 4h | Completed | [phase-02](./phase-02-navigation-and-auth-entryflow-refactor.md) |
| 3 | SEO, Canonical, and Legacy `/jobs` Compatibility | 3h | Completed | [phase-03](./phase-03-seo-canonical-and-legacy-jobs-compat.md) |
| 4 | QA Matrix, Rollout, and Rollback | 4h | In Progress | [phase-04-qa-rollout-and-rollback.md](./phase-04-qa-rollout-and-rollback.md) |

## Execution Cases to Cover

1. Guest user opens `/` and can browse + search jobs.
2. Logged-in candidate opens `/` and stays on `/` (no forced dashboard redirect).
3. Logged-in recruiter/admin opens `/` and can still navigate to dashboard quickly.
4. Existing links to `/jobs` continue to work and preserve query params.
5. Query-state from legacy `/jobs?q=...&sort=...` maps to `/` correctly.
6. Auth callback after login/register respects intended destination (no accidental forced `/dashboard` when user intended jobs browse).
7. Empty-state listing on `/` is consistent with previous `/jobs`.
8. Feature flags off scenario falls back safely (no broken navigation loop).
9. SEO: canonical duplication between `/` and `/jobs` is resolved.
10. Mobile nav and breadcrumbs do not show stale “Browse Jobs” pointing to deprecated route.

## Risks

- Duplicate content and SEO cannibalization if both `/` and `/jobs` are indexed equally.
- Auth flow regressions from callback/role redirect conflicts.
- Silent navigation drift if route literals remain scattered.

## Mitigations

- Route constant + lint/grep gate to eliminate hardcoded `/jobs` listing links.
- Canonical policy and optional redirect policy for `/jobs`.
- Regression checklist for auth callbacks and role-specific paths.

## Success Criteria

- 100% of “browse jobs” entry points target `/`.
- No forced root redirect to dashboard.
- `/jobs` legacy links still functional without breaking filters/query.
- No P1/P2 regression in candidate apply flow.

## Execution Update (2026-03-10)

- Implemented route constants: `apps/web/lib/routes.ts` with root listing and legacy alias helpers.
- `/` now renders shared jobs listing surface (`apps/web/components/jobs/jobs-listing-page.tsx`).
- `/jobs` now acts as compatibility alias and redirects to `/` with query preservation (`apps/web/app/jobs/page.tsx`).
- Updated candidate nav + CTAs + pagination/filter URLs to target `/`.
- Updated login fallback callback to `/` when no `callbackUrl` is provided.
- Updated sitemap static routes to avoid duplicate listing URL indexing.
- Validation: `pnpm -C apps/web lint` passed.
