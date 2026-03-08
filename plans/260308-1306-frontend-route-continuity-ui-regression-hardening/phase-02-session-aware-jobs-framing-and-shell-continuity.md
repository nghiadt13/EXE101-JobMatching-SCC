# Phase 2: Session-Aware Jobs Framing and Shell Continuity

## Context Links

- Parent: [plan.md](./plan.md)
- Dependency: [phase-01](./phase-01-auth-intent-capture-and-redirect-continuity.md)
- Relevant files:
  - `../../apps/web/app/jobs/page.tsx`
  - `../../apps/web/app/jobs/[slug]/page.tsx`
  - `../../apps/web/components/auth/dashboard-shell.tsx`
  - `../../apps/web/components/auth/mobile-nav.tsx`
  - `../../apps/web/lib/navigation.ts`
  - `../../apps/web/app/dashboard/candidate/page.tsx`

## Overview

- Priority: P1
- Status: Pending
- Brief: keep `/jobs` and `/jobs/[slug]` feeling connected for signed-in users instead of forcing a public-shell detour.

## Key Insights

- Candidate dashboard CTA points to `/jobs`, but `/jobs` currently renders public framing only.
- Public jobs routes always render a `Sign in` CTA even when a session already exists.
- Sidebar and mobile active-state rules special-case `/jobs` poorly, so nested jobs routes are easy to mislabel.

## Requirements

Functional:

- Make jobs listing and detail routes session-aware.
- For signed-in candidate users, render jobs routes with dashboard shell continuity and correct active nav.
- For signed-in recruiter and admin users, remove irrelevant `Sign in` framing and provide account-relevant actions.
- Keep logged-out jobs pages public.

Non-functional:

- Do not create new backend routes.
- Do not duplicate jobs-fetch logic into role-specific pages.
- Avoid shell rewrites; adapt existing shell usage.

## Architecture

Prefer wrapper composition over route duplication:

`jobs route -> detect session -> choose public framing or dashboard shell framing -> reuse same page body`

Do not create `/dashboard/candidate/jobs` unless product explicitly wants a new canonical route. It solves nothing by itself and creates more drift.

## Related Code Files

Modify:

- `apps/web/app/jobs/page.tsx`
- `apps/web/app/jobs/[slug]/page.tsx`
- `apps/web/components/auth/dashboard-shell.tsx`
- `apps/web/components/auth/mobile-nav.tsx`
- `apps/web/lib/navigation.ts`
- `apps/web/app/dashboard/candidate/page.tsx`

## Implementation Steps

1. Audit current nav config for how `/jobs` is represented for candidate users.
2. Decide the active-state rule for `/jobs` and `/jobs/[slug]` when a candidate is signed in.
3. Refactor jobs listing page so signed-in users can render through the existing shell without changing data fetching.
4. Apply the same framing decision to jobs detail page.
5. Replace public-only CTA blocks with session-aware actions.
6. Recheck mobile-nav active state using the same rule as desktop.

## Todo List

- [ ] Define active-state behavior for `/jobs` family.
- [ ] Add shell continuity for signed-in candidate jobs browsing.
- [ ] Remove irrelevant `Sign in` framing for signed-in recruiter/admin users.
- [ ] Align desktop and mobile nav behavior.

## Success Criteria

- Candidate dashboard -> `Browse jobs` no longer feels like leaving the product shell.
- Logged-in users on jobs routes see context-aware actions.
- Desktop and mobile nav agree on active route state.

## Risk Assessment

- Risk: coupling public and dashboard layout logic too tightly.
- Mitigation: keep one shared jobs-content body and a thin framing switch.

## Security Considerations

- Shell continuity must not imply new permissions.
- Role checks remain enforced by existing session logic.

## Next Steps

- Recover return context through apply and CV prerequisite branches in Phase 3.