# Phase 5: Flow-Specific UX Upgrades Across Auth, Candidate, Recruiter, and Admin Surfaces

## Context Links

- Parent: [plan.md](./plan.md)
- Dependencies:
  - [phase-03](./phase-03-navigation-shell-breadcrumbs-and-route-affordances.md)
  - [phase-04](./phase-04-mutation-feedback-toast-coverage-and-async-state-polish.md)
- Relevant files:
  - auth: `../../apps/web/app/page.tsx`, `../../apps/web/components/auth/*`
  - candidate: `../../apps/web/app/dashboard/candidate/**`, `../../apps/web/components/cv/*`, `../../apps/web/components/applications/candidate-*`
  - recruiter: `../../apps/web/app/dashboard/recruiter/**`, `../../apps/web/components/jobs/*`, `../../apps/web/components/applications/recruiter-*`
  - admin: `../../apps/web/app/dashboard/admin/**`, `../../apps/web/components/users/admin-users-table.tsx`

## Overview

- Priority: P1
- Status: Pending
- Brief: upgrade each high-traffic user flow so the app feels coherent end to end, not just prettier at the component level.

## Key Insights

- Candidate flow needs stronger onboarding and next-step clarity around CV upload, primary CV, apply, and application tracking.
- Recruiter flow needs clearer draft-review-publish affordances, parse status emphasis, and denser but more scannable list/detail surfaces.
- Admin and profile surfaces need stronger table readability, empty states, and route context.
- Auth entry pages are functional but too plain for the first impression of the product.

## Requirements

Functional:

- Improve landing, login, and register presentation without changing auth flow behavior.
- Improve candidate dashboard, CV list, applications list, and apply form clarity.
- Improve recruiter dashboard, jobs list/detail, applications review, and JD upload flow clarity.
- Improve admin users and profile surfaces for readability and action discovery.

Non-functional:

- Avoid major component rewrites where a targeted layout and styling pass is enough.
- Keep domain wording accurate to the API and current business rules.
- Ensure each flow still works with no JS surprises around server actions.
- Preserve sensitive interaction defaults such as primary-CV selection in apply forms and recruiter-only lifecycle affordances.

## Architecture

This phase applies a shared surface model:

`page header -> status summary -> main action group -> content blocks -> empty/error/pending states`

Each route should communicate:

1. where the user is
2. what state the data is in
3. what they can do next

## Related Code Files

Modify:

- Auth page/form files
- Candidate CV and applications pages/components
- Recruiter jobs and application review pages/components
- Admin users page/components
- Profile page/component

## Implementation Steps

1. Improve public landing, login, and register page composition.
2. Rework candidate surfaces around progress, status, empty states, and action grouping.
3. Rework recruiter surfaces around job lifecycle clarity, parse state visibility, and review actions.
4. Rework admin and profile surfaces for cleaner table/list actions and better headers.
5. Verify flow-specific invariants after each route family before moving to the next.
6. Audit cross-flow consistency one route family at a time.

## Todo List

- [ ] Polish auth entry points.
- [ ] Improve candidate journey screens.
- [ ] Improve recruiter journey screens.
- [ ] Improve admin and profile screens.
- [ ] Verify candidate apply default CV still follows primary-selection rules.
- [ ] Verify recruiter lifecycle controls stay role-scoped and state-scoped.
- [ ] Align flow-level messaging and status display.

## Success Criteria

- Each major role flow feels connected and deliberate.
- Empty states include useful next actions.
- Status pills, page headers, and action bars are consistent across flows.

## Risk Assessment

- Risk: this phase grows into feature expansion such as search, filters, export, or analytics.
- Mitigation: keep scope on presentation, flow clarity, and low-risk affordances only.

## Security Considerations

- Do not add UI paths that imply unsupported actions.
- Keep role-specific actions hidden unless the route already supports them.

## Next Steps

- Finish with responsive, accessibility, and regression QA in Phase 6.