# Phase 1: UX Baseline, Constraints, and Shared Visual Language

## Context Links

- Related plan: [plan.md](./plan.md)
- Related plans:
  - `../260305-2141-user-management-admin-profile-rbac/plan.md`
  - `../260305-2213-cv-management-upload-parsing-security/plan.md`
  - `../260305-2237-job-management-recruiter-jobs-lifecycle/plan.md`
- Relevant files:
  - `../../apps/web/app/layout.tsx`
  - `../../apps/web/app/globals.css`
  - `../../apps/web/components/auth/dashboard-shell.tsx`

## Overview

- Priority: P1
- Status: Pending
- Brief: establish a minimal but explicit visual baseline and guardrails so later polish work stays consistent and does not leak into logic refactors.

## Key Insights

- `sonner` and a root `Toaster` already exist, so the app does not need a new notification library.
- Most pages rely on repeated inline Tailwind classes for buttons, cards, borders, spacing, and header blocks.
- The current shell is functional but too neutral; it does not provide enough navigation context or visual hierarchy.
- The safest first move is not redesign. It is to define repeated patterns and stop page-level drift.

## Requirements

Functional:

- Inventory repeated UI patterns across auth, candidate, recruiter, and admin pages.
- Define a shared visual direction for spacing, radii, borders, cards, pills, buttons, and headers.
- Keep existing route structure, auth rules, and API calls intact.

Non-functional:

- Avoid visual churn that touches every page at once.
- Preserve current SSR/client boundaries.
- Keep new shared UI code small and readable.

## Architecture

This phase creates the contract for later UI work:

1. root style variables and baseline utility rules in `globals.css`
2. one page-header convention
3. one dashboard-shell convention
4. one action-button hierarchy
5. one alert/status vocabulary

## Related Code Files

Modify:

- `apps/web/app/globals.css`
- `apps/web/app/layout.tsx`
- `apps/web/components/auth/dashboard-shell.tsx`

Potential new files:

- `apps/web/components/ui/*`

## Implementation Steps

1. Audit repeated button, card, badge, and section-header class groups.
2. Choose semantic color roles for neutral, success, warning, danger, and info surfaces.
3. Define shared page spacing rules for public pages and dashboard pages.
4. Tighten root layout defaults for typography, background treatment, and toaster placement.
5. Update dashboard shell to support richer heading content and future route navigation affordances.

## Todo List

- [ ] Document repeated UI patterns and duplication hotspots.
- [ ] Decide the minimum primitive set required for the next phases.
- [ ] Define semantic color and spacing rules.
- [ ] Update shell requirements for role navigation and breadcrumbs.

## Success Criteria

- Future phases can reuse explicit UI decisions instead of inventing page-level styling.
- No business logic files need to change in this phase.
- The team can point to one clear visual baseline for new work.

## Risk Assessment

- Risk: too much time spent on visual bikeshedding.
- Mitigation: lock only what is already repeated in the current app.

## Security Considerations

- No auth, RBAC, or mutation behavior changes.
- Do not expose request IDs or backend messages outside existing error boundaries unless intentionally surfaced.

## Next Steps

- Build the shared primitives in Phase 2.