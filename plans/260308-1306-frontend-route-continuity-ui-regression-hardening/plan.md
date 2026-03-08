---
title: "Frontend Route Continuity and UI Regression Hardening Plan"
description: "Fix route continuity, auth intent loss, and navigation regressions across public, candidate, recruiter, and admin web screens without changing backend behavior."
status: pending
priority: P1
effort: 18h
branch: main
tags: [frontend, ui, ux, navigation, auth, continuity, regression]
created: 2026-03-08
---

# Frontend Route Continuity and UI Regression Hardening Plan

## Summary

Goal: remove UI/UX regressions introduced or left unresolved by recent FE polish work, with emphasis on route continuity, session-aware framing, next-step guidance, and active navigation state.

This is not a redesign plan. It is a containment and hardening plan.

Hard constraints:

- Keep auth rules, RBAC, session checks, and protected-route behavior unchanged.
- Keep server actions, backend APIs, and matching logic unchanged.
- Prefer additive wrapper, layout, query-param, and CTA fixes over route churn.
- Fix the dead ends first. Cosmetic cleanup comes last.

Confirmed problem set:

1. Candidate dashboard `Browse jobs` exits the dashboard shell by linking to `/jobs` with public framing.
2. Public jobs routes show public CTA framing even for logged-in users.
3. Login does not currently honor incoming `callbackUrl` intent.
4. Job detail -> login -> apply -> CV prerequisite flow loses return context.
5. Candidate and recruiter application screens lack strong next-step actions and useful empty states.
6. Recruiter jobs summary copy is misleading (`Visible drafts`).
7. Admin dashboard stats expose counts without enough drill-down affordance.
8. Dashboard shell and mobile nav active state for `/jobs` and nested detail routes is too brittle.

## Phases

| # | Phase | Status | Effort | Link |
|---|-------|--------|--------|------|
| 1 | Auth intent capture and redirect continuity | Pending | 3h | [phase-01](./phase-01-auth-intent-capture-and-redirect-continuity.md) |
| 2 | Session-aware jobs framing and shell continuity | Pending | 4h | [phase-02](./phase-02-session-aware-jobs-framing-and-shell-continuity.md) |
| 3 | Apply and CV prerequisite return-path recovery | Pending | 4h | [phase-03](./phase-03-apply-and-cv-prerequisite-return-path-recovery.md) |
| 4 | Role-specific next-step affordances and copy corrections | Pending | 4h | [phase-04](./phase-04-role-specific-next-step-affordances-and-copy-corrections.md) |
| 5 | Nav-state hardening and regression smoke sweep | Pending | 3h | [phase-05](./phase-05-nav-state-hardening-and-regression-smoke-sweep.md) |

## Dependency Order

- Phase 2 depends on Phase 1.
- Phase 3 depends on Phases 1-2.
- Phase 4 depends on Phases 2-3.
- Phase 5 depends on Phases 1-4.

## Execution Notes

- Use route intent as data. Do not rely on browser back behavior.
- Standardize return context with query params or hidden form fields where already compatible with current route patterns.
- Make `/jobs` and `/jobs/[slug]` session-aware instead of creating new backend-facing routes.
- Reuse existing shell, breadcrumb, empty-state, page-header, and stat-card components where possible.
- Keep junior implementation bounded: one route family per phase, explicit smoke checks after each phase.

## Likely Files By Phase

Phase 1:

- `apps/web/app/login/page.tsx`
- `apps/web/components/auth/login-form.tsx`
- `apps/web/app/jobs/[slug]/page.tsx`
- `apps/web/app/page.tsx`

Phase 2:

- `apps/web/app/jobs/page.tsx`
- `apps/web/app/jobs/[slug]/page.tsx`
- `apps/web/components/auth/dashboard-shell.tsx`
- `apps/web/components/auth/mobile-nav.tsx`
- `apps/web/lib/navigation.ts`

Phase 3:

- `apps/web/app/jobs/[slug]/page.tsx`
- `apps/web/components/applications/candidate-apply-form.tsx`
- `apps/web/app/dashboard/candidate/cvs/page.tsx`
- `apps/web/components/cv/cv-upload-form.tsx`
- `apps/web/components/cv/cv-list.tsx`

Phase 4:

- `apps/web/app/dashboard/candidate/page.tsx`
- `apps/web/app/dashboard/candidate/applications/page.tsx`
- `apps/web/components/applications/candidate-applications-table.tsx`
- `apps/web/app/dashboard/recruiter/applications/page.tsx`
- `apps/web/components/applications/recruiter-applications-table.tsx`
- `apps/web/app/dashboard/recruiter/jobs/page.tsx`
- `apps/web/app/dashboard/admin/page.tsx`
- `apps/web/components/dashboard/dashboard-stat-card.tsx`

Phase 5:

- `apps/web/components/auth/dashboard-shell.tsx`
- `apps/web/components/auth/mobile-nav.tsx`
- `apps/web/lib/navigation.ts`
- `apps/web/app/jobs/page.tsx`
- `apps/web/app/jobs/[slug]/page.tsx`
- dashboard route pages under `apps/web/app/dashboard/**`

## Critical Smoke Tests

1. Logged-out user opens `/jobs/[slug]`, clicks sign in, submits valid credentials, returns to the same job detail page.
2. Candidate from dashboard clicks `Browse jobs`, lands on `/jobs` with dashboard shell continuity and active jobs nav.
3. Candidate on `/jobs/[slug]` without CV sees a CV prerequisite CTA, goes to CV management, completes upload/select flow, and can return to the same job detail route.
4. Candidate applications empty state offers a real next action and routes to a useful destination.
5. Recruiter applications empty state offers navigation to jobs/create flow instead of a dead-end message.
6. Recruiter jobs page no longer uses misleading draft summary copy.
7. Admin dashboard stat cards expose at least one clear drill-down path where a destination exists today, without inventing new backend features.
8. Desktop sidebar and mobile nav correctly mark active state for `/jobs`, `/jobs/[slug]`, `/dashboard/recruiter/jobs`, and `/dashboard/recruiter/jobs/[id]`.
9. Logged-in recruiter or admin opening public jobs routes does not see irrelevant `Sign in` CTA framing.

## Dependency Judgement Versus Existing FE UI/UX Plan

Reference: `plans/260308-1153-fe-ui-ux-improvement/plan.md`

Judgement:

- Do not fold this into the existing broad plan as another vague polish pass.
- This new plan is a corrective follow-on focused on regressions, continuity, and misleading UX, not general visual refinement.
- It partially supersedes the old plan's navigation and flow-polish intent, especially around its Phase 3 and Phase 5 areas.
- Execute this hardening plan before resuming any broader FE polish. Otherwise the team will keep polishing broken flows.
- After this plan lands, the older broad plan should be narrowed to non-regression visual cleanup only, or marked partially superseded.

## Definition Of Done

- Auth intent survives login for supported entry flows.
- Public jobs routes render context-aware actions for logged-in users.
- Candidate apply and CV prerequisite flows preserve return context.
- Candidate, recruiter, and admin screens expose concrete next actions instead of static counts or dead-end empty states.
- Active navigation is correct on desktop and mobile for jobs-related routes.
- No backend contract, matching behavior, or RBAC rule changes are required.

## Risks

- Overreaching into a new route architecture. Do not.
- Adding continuity parameters inconsistently. Centralize the pattern early.
- Trying to create drill-down destinations that do not exist. Use only real destinations.

## Open Questions

- None blocking. The main risk is scope drift into redesign work.