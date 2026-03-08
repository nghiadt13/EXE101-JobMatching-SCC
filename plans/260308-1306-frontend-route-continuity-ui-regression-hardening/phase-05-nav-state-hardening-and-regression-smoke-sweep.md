# Phase 5: Nav-State Hardening and Regression Smoke Sweep

## Context Links

- Parent: [plan.md](./plan.md)
- Dependency: [phase-04](./phase-04-role-specific-next-step-affordances-and-copy-corrections.md)
- Relevant files:
  - `../../apps/web/components/auth/dashboard-shell.tsx`
  - `../../apps/web/components/auth/mobile-nav.tsx`
  - `../../apps/web/lib/navigation.ts`
  - `../../apps/web/app/jobs/page.tsx`
  - `../../apps/web/app/jobs/[slug]/page.tsx`
  - `../../apps/web/app/dashboard/candidate/page.tsx`
  - `../../apps/web/app/dashboard/recruiter/jobs/[id]/page.tsx`
  - `../../apps/web/app/dashboard/recruiter/applications/page.tsx`
  - `../../apps/web/app/dashboard/admin/page.tsx`

## Overview

- Priority: P1
- Status: Pending
- Brief: verify the continuity fixes actually hold together on desktop and mobile, then close the loop with focused smoke coverage.

## Key Insights

- Desktop and mobile nav currently duplicate active-state logic.
- `/jobs` and nested detail routes are where active-state bugs usually hide.
- A continuity plan without route-by-route smoke checks is fiction.

## Requirements

Functional:

- Ensure desktop and mobile nav share the same active-state behavior.
- Verify jobs listing/detail routes, recruiter job detail, and role dashboards all render expected nav state.
- Run focused smoke tests for the corrected continuity paths.

Non-functional:

- Do not expand this into generic visual QA.
- Keep the smoke list short and brutal.

## Architecture

Prefer one nav-state rule reused in both shell components.

Then validate route families in this order:

`login intent -> public jobs -> candidate jobs/apply/CV recovery -> recruiter jobs/applications -> admin dashboard`

## Related Code Files

Modify if needed:

- `apps/web/components/auth/dashboard-shell.tsx`
- `apps/web/components/auth/mobile-nav.tsx`
- `apps/web/lib/navigation.ts`

Verification targets:

- `apps/web/app/jobs/page.tsx`
- `apps/web/app/jobs/[slug]/page.tsx`
- `apps/web/app/dashboard/candidate/**`
- `apps/web/app/dashboard/recruiter/**`
- `apps/web/app/dashboard/admin/**`

## Implementation Steps

1. Remove duplicated active-state rules if both shell components diverge.
2. Validate candidate jobs browsing highlights the intended nav item.
3. Validate recruiter job detail still highlights `Jobs`.
4. Validate application pages highlight `Applications` on both desktop and mobile.
5. Run the smoke tests from the parent plan in sequence.
6. Record any remaining regressions before closing the plan.

## Todo List

- [ ] Unify desktop and mobile active-state behavior.
- [ ] Verify jobs and applications route families.
- [ ] Execute focused smoke sweep.
- [ ] Record residual issues, if any.

## Success Criteria

- No obvious route continuity regressions remain in the corrected flows.
- Nav state is consistent on desktop and mobile.
- The smoke suite passes without backend changes.

## Risk Assessment

- Risk: false confidence from checking only happy paths.
- Mitigation: include missing-CV and logged-in public-route cases.

## Security Considerations

- Smoke tests must confirm unauthorized roles still hit existing route guards.

## Next Steps

- If residual issues remain, spin a tiny follow-up bug-fix plan. Do not reopen broad polish scope.