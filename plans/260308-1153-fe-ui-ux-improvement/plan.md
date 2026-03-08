---
title: "Frontend UI/UX Improvement Plan"
description: "Improve navigation, feedback, consistency, and role-based workflow clarity in the web app without changing backend or domain logic."
status: planned
priority: P1
effort: 28h
branch: main
tags: [frontend, ui, ux, navigation, forms, feedback, accessibility]
created: 2026-03-08
last-updated: 2026-03-08
blockedBy: []
blocks: []
---

# Frontend UI/UX Improvement Plan

## Overview

Goal: make the `apps/web` experience feel deliberate, connected, and reliable without touching backend contracts, auth rules, server action behavior, or matching logic.

Primary problems observed in the current app:

1. Navigation is fragmented. Links exist, but route-to-route wayfinding is weak and dashboard shells are too bare.
2. UI patterns are duplicated inline across forms, cards, status pills, and action buttons, so polish is inconsistent.
3. Toast support already exists via `sonner`, but feedback is inconsistent across uploads, mutations, loading, and failure states.
4. Empty/loading/error states are uneven, especially across public job browsing and role-based dashboard flows.
5. The app works, but it still looks like stitched-together feature pages instead of one product.

Non-goal: do not redesign business workflows or change the data shape returned by the API. This plan is UI-first, additive, and regression-averse.

Critical invariants:

- Do not change auth redirects, role redirects, or protected-route behavior.
- Do not replace existing redirect/query-param based success or error flows unless that behavior change is explicitly designed and separately validated.
- Do not change default business rules such as primary-CV selection, duplicate-apply blocking, recruiter lifecycle permissions, or admin self-delete prevention.

## Phases

| # | Phase | Status | Effort | Link |
|---|-------|--------|--------|------|
| 1 | UX baseline, constraints, and shared visual language | Pending | 4h | [phase-01](./phase-01-ux-baseline-constraints-and-shared-visual-language.md) |
| 2 | Shared UI primitives and page composition cleanup | Pending | 5h | [phase-02](./phase-02-shared-ui-primitives-and-page-composition-cleanup.md) |
| 3 | Navigation shell, breadcrumbs, and route affordances | Pending | 5h | [phase-03](./phase-03-navigation-shell-breadcrumbs-and-route-affordances.md) |
| 4 | Mutation feedback, toast coverage, and async state polish | Pending | 5h | [phase-04](./phase-04-mutation-feedback-toast-coverage-and-async-state-polish.md) |
| 5 | Flow-specific UX upgrades across auth, candidate, recruiter, and admin surfaces | Pending | 6h | [phase-05](./phase-05-flow-specific-ux-upgrades-across-auth-candidate-recruiter-and-admin-surfaces.md) |
| 6 | Responsive hardening, accessibility, and manual regression QA | Pending | 3h | [phase-06](./phase-06-responsive-hardening-accessibility-and-manual-regression-qa.md) |

## Dependencies

- Phase 2 depends on Phase 1.
- Phase 3 depends on Phases 1-2.
- Phase 4 depends on Phases 1-2.
- Phase 5 depends on Phases 2-4.
- Phase 6 depends on Phases 3-5.

## Execution Strategy

- Start with a thin visual system, not a big redesign.
- Extract only the UI primitives that are already repeated in at least three places.
- Keep server components and server actions structurally intact; move styling and presentation first.
- Prefer additive route affordances such as breadcrumbs, section actions, and clearer empty states over layout churn.
- Apply toasts only where user intent and mutation outcomes need explicit confirmation.
- Validate every touched flow with manual route-based smoke checks before moving to the next phase.

## Target UX Architecture

```text
app routes
  -> role-aware shell + page header conventions
  -> shared UI primitives (button/card/badge/alert/empty/loading)
  -> flow-specific forms and tables
  -> consistent async feedback (pending, success, error, requestId)
  -> responsive + accessible interaction layer
```

## Most Relevant Existing Areas

Core shell and styling:

- `apps/web/app/layout.tsx`
- `apps/web/app/globals.css`
- `apps/web/components/auth/dashboard-shell.tsx`

Auth and public routes:

- `apps/web/app/page.tsx`
- `apps/web/app/login/page.tsx`
- `apps/web/app/register/page.tsx`
- `apps/web/components/auth/login-form.tsx`
- `apps/web/components/auth/register-form.tsx`

Candidate surfaces:

- `apps/web/app/dashboard/candidate/page.tsx`
- `apps/web/app/dashboard/candidate/cvs/page.tsx`
- `apps/web/app/dashboard/candidate/applications/page.tsx`
- `apps/web/components/cv/cv-upload-form.tsx`
- `apps/web/components/cv/cv-list.tsx`
- `apps/web/components/applications/candidate-apply-form.tsx`
- `apps/web/components/applications/candidate-applications-table.tsx`

Recruiter surfaces:

- `apps/web/app/dashboard/recruiter/page.tsx`
- `apps/web/app/dashboard/recruiter/jobs/page.tsx`
- `apps/web/app/dashboard/recruiter/jobs/[id]/page.tsx`
- `apps/web/app/dashboard/recruiter/applications/page.tsx`
- `apps/web/components/jobs/jd-upload-form.tsx`
- `apps/web/components/jobs/recruiter-job-form.tsx`
- `apps/web/components/jobs/recruiter-jobs-table.tsx`
- `apps/web/components/jobs/recruiter-job-status-actions.tsx`
- `apps/web/components/applications/recruiter-applications-table.tsx`

Admin and profile:

- `apps/web/app/dashboard/admin/page.tsx`
- `apps/web/app/dashboard/admin/users/page.tsx`
- `apps/web/app/dashboard/profile/page.tsx`
- `apps/web/components/users/admin-users-table.tsx`
- `apps/web/components/profile/profile-form.tsx`

## Related Existing Plans

- `plans/260305-2141-user-management-admin-profile-rbac/`
- `plans/260305-2213-cv-management-upload-parsing-security/`
- `plans/260305-2237-job-management-recruiter-jobs-lifecycle/`
- `plans/260305-2358-application-flow-candidate-apply-recruiter-review/`
- `plans/260305-2359-candidate-job-listing-apply-entrypoint-flow/`
- `plans/260306-0012-dashboard-stats-role-based-ui/`

Cross-plan scan result: those plans overlap in touched frontend files, but they do not create a hard blocker for this plan because the feature flows already exist in code. This plan improves presentation and route affordances on top of those live surfaces.

## Definition Of Done

- The web app has one coherent visual baseline across pages, forms, cards, pills, and action groups.
- Users can move through role-based flows with clearer navigation, back-links, breadcrumbs, and next-step actions.
- Toasts and inline alerts are used intentionally and consistently for mutations, failures, and long-running operations.
- Empty, loading, and error states are reusable and present across major list/detail flows.
- Responsive behavior is improved on mobile-sized screens without rewriting business components from scratch.
- Auth, dashboard, CV, job, and application flows still use the same API contracts and logic as before.
- Web lint and build pass, and manual smoke checks for the main flows pass.

## Biggest Risks

- A broad visual cleanup can accidentally turn into a redesign and create churn across too many files.
- Moving too much logic into new UI abstractions can break server/client boundaries in App Router pages.
- Toast spam or duplicated messaging can make error handling worse instead of better.
- Responsive fixes on tables and dense recruiter screens can regress desktop readability if done carelessly.

## Mitigation

- Keep the first pass limited to repeated UI primitives and page header patterns.
- Do not change fetch paths, API clients, auth redirects, or server action signatures in the UI refactor phases.
- Define toast rules early: success for completed mutations, inline for field validation, banner/alert for page-level fetch failures.
- Use route-by-route smoke QA after each phase instead of doing one massive final verification only.

## Verification Matrix

Commands:

- `npm run lint -w web`
- `$env:AUTH_SECRET='local-test-secret-for-build-only'; npm run build -w web`

Manual flows:

- Public landing -> login -> register -> dashboard redirect
- Candidate dashboard -> CV upload -> CV list -> apply to job -> applications list
- Recruiter dashboard -> job list -> JD upload -> review job -> publish/close action -> applications review
- Admin dashboard -> users list -> profile page navigation

Required checklist coverage before sign-off:

- Auth:
  - register auto-login redirects to the correct role dashboard
  - logged-out access to `/dashboard` redirects to `/login`
  - logged-in access to `/login` and `/register` redirects away correctly
  - sign out returns to `/login`
- CV:
  - first uploaded CV becomes primary
  - setting another primary unsets the previous one
  - deleting the primary CV reassigns another active CV as primary
  - invalid type and oversize upload still fail cleanly
- Jobs:
  - `/jobs` shows published jobs only
  - `/jobs/[slug]` for draft or closed jobs remains not found
  - invalid recruiter lifecycle transitions remain rejected
- Applications:
  - duplicate apply stays blocked with explicit feedback
  - missing CV or apply failure stays visible to the user
  - invalid recruiter status transitions remain rejected
  - recruiter cannot apply
- Admin/Profile:
  - admin cannot delete own account
  - candidate/recruiter cannot access admin users page
  - profile updates still work per role

Reference smoke docs:

- `apps/web/docs/auth-smoke-checklist.md`
- `apps/web/docs/cv-management-smoke-checklist.md`
- `apps/web/docs/job-management-smoke-checklist.md`
- `apps/web/docs/application-flow-smoke-checklist.md`
- `apps/web/docs/user-management-smoke-checklist.md`

## Open Questions

- None blocking. The main constraint is discipline: keep this plan focused on visual system, route affordances, and feedback patterns, not new product features.