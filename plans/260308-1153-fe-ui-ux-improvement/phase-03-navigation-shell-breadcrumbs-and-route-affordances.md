# Phase 3: Navigation Shell, Breadcrumbs, and Route Affordances

## Context Links

- Parent: [plan.md](./plan.md)
- Dependency: [phase-02](./phase-02-shared-ui-primitives-and-page-composition-cleanup.md)
- Relevant files:
  - `../../apps/web/components/auth/dashboard-shell.tsx`
  - `../../apps/web/app/dashboard/candidate/page.tsx`
  - `../../apps/web/app/dashboard/recruiter/page.tsx`
  - `../../apps/web/app/dashboard/admin/page.tsx`
  - `../../apps/web/app/dashboard/profile/page.tsx`
  - `../../apps/web/app/jobs/page.tsx`
  - `../../apps/web/app/jobs/[slug]/page.tsx`

## Overview

- Priority: P1
- Status: Pending
- Brief: make it obvious where the user is, where they can go next, and how to return without relying on browser back behavior.

## Key Insights

- Current dashboard pages expose action links, but there is no persistent role-scoped navigation.
- Detail pages have one-off back links, but not a consistent breadcrumb or page-context pattern.
- Public job browsing and dashboard routes still feel disconnected from one another.

## Requirements

Functional:

- Add role-aware navigation into the dashboard shell.
- Add consistent breadcrumb support for nested recruiter, candidate, admin, and profile routes.
- Improve top-of-page action clusters so primary and secondary actions are obvious.
- Add clearer cross-links between public jobs, login, dashboard, profile, CVs, jobs, and applications.

Non-functional:

- Do not change route paths.
- Keep navigation logic declarative and role-scoped.
- Ensure mobile fallback behavior remains usable.

## Architecture

Navigation should be driven by route metadata and current role:

`dashboard-shell -> role nav model + optional breadcrumbs + page actions`

Chosen implementation path:

- keep `DashboardShell` as a shared presentation component used by server pages
- pass breadcrumb items and optional page actions from each page into the shell
- keep role navigation config in one shared module
- avoid a client-only shell and avoid nested layout rewrites for this plan

Avoid hardcoding breadcrumb generation from pathname on the client. That adds unnecessary App Router complexity for this scope.

## Related Code Files

Modify:

- `apps/web/components/auth/dashboard-shell.tsx`
- dashboard pages under `apps/web/app/dashboard/**`
- public jobs pages under `apps/web/app/jobs/**`

Potential new files:

- `apps/web/lib/navigation.ts`
- `apps/web/components/ui/breadcrumbs.tsx`
- `apps/web/components/ui/role-nav.tsx`

## Implementation Steps

1. Define role navigation maps for candidate, recruiter, and admin.
2. Extend `DashboardShell` to render role-aware nav plus page-provided breadcrumb metadata.
3. Standardize page action areas for primary CTA and supporting links.
4. Add candidate and recruiter route cross-links so flows feel connected.
5. Review public jobs pages for obvious dead-ends and missing return paths.

## Todo List

- [ ] Add role navigation config.
- [ ] Add page-provided breadcrumb support for nested routes.
- [ ] Normalize page-level quick actions.
- [ ] Connect public and authenticated job flows more clearly.

## Success Criteria

- Users can move between major role surfaces without guessing.
- Detail pages provide clear context and return paths.
- The shell feels like a product scaffold instead of a static header block.

## Risk Assessment

- Risk: overbuilding a full app shell when simple navigation aids are enough.
- Mitigation: ship only what the current route tree needs.

## Security Considerations

- Navigation must not expose admin/recruiter links to unauthorized roles in rendered UI.
- RBAC stays enforced by existing route/session logic, not by navigation visibility alone.

## Next Steps

- Layer mutation and async feedback consistency on top in Phase 4.