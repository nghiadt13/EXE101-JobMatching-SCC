# Phase 6: Responsive Hardening, Accessibility, and Manual Regression QA

## Context Links

- Parent: [plan.md](./plan.md)
- Dependency: [phase-05](./phase-05-flow-specific-ux-upgrades-across-auth-candidate-recruiter-and-admin-surfaces.md)
- Relevant files:
  - `../../apps/web/app/**`
  - `../../apps/web/components/**`
  - `../../README.md`
  - `../../docs/06-release-readiness-acceptance-matrix.md`

## Overview

- Priority: P1
- Status: Pending
- Brief: make the improved UI hold up on small screens, keyboard navigation, and the main regression-prone role flows.

## Key Insights

- Several pages use dense tables/cards and small text that are usable on desktop but weak on mobile.
- There are dedicated `loading.tsx` files only in a few dashboard areas and no obvious route-level `error.tsx` coverage.
- Async/loading/error strategy should already be chosen in Phase 4; this phase validates coverage and fills only true leftovers.
- UI polish without systematic QA is how teams accidentally break working flows with harmless-looking refactors.

## Requirements

Functional:

- Review mobile layouts for jobs, CVs, applications, and dashboard action groups.
- Improve focus states, keyboard visibility, and color-plus-text status affordances.
- Verify loading, empty, and error handling across major route families against the Phase 4 contract.
- Run route-based manual QA against the main role journeys.

Non-functional:

- Prefer low-risk responsive adjustments over full component rewrites.
- Keep accessibility fixes practical and high-value.
- Treat web lint/build and manual smoke checks as release gates for this plan.

## Architecture

Validation layers:

1. static: lint and build
2. route-level visual review: desktop and mobile widths
3. journey-level smoke QA: auth, candidate, recruiter, admin

## Related Code Files

Modify where required:

- route pages and shared components with weak mobile layout or focus states

Potential additions:

- only leftover `apps/web/app/**/loading.tsx` or `apps/web/app/**/error.tsx` files that were intentionally deferred after the Phase 4 contract

## Implementation Steps

1. Audit mobile behavior for each route family.
2. Improve tap targets, stacking, and overflow handling.
3. Add or standardize focus rings, aria-friendly text, and icon-plus-label status cues.
4. Verify route-level loading/error coverage matches the chosen contract and fill only leftover gaps.
5. Run the manual regression matrix and record failures before sign-off.
6. Run the existing smoke checklist edge cases, not just happy-path flows.

## Todo List

- [ ] Review responsive layout breakpoints.
- [ ] Improve accessibility affordances.
- [ ] Verify loading and error state coverage against the Phase 4 contract.
- [ ] Run manual regression QA for major flows.
- [ ] Run documented edge-case smoke checklist items.
- [ ] Run web lint and build.

## Success Criteria

- The improved UI remains usable on mobile-sized screens.
- Keyboard and focus behavior is materially better than before.
- No major auth, dashboard, CV, job, or application flow regresses during polish work.

## Risk Assessment

- Risk: late responsive fixes create layout regressions in dense recruiter/admin screens.
- Mitigation: test each role flow at desktop and mobile widths before moving on.

## Security Considerations

- Route-level error states must not leak protected data.
- QA must include unauthorized-role navigation attempts to confirm redirects still hold.

## Next Steps

- Mark plan ready for implementation once lint/build and route smoke checks are clean.