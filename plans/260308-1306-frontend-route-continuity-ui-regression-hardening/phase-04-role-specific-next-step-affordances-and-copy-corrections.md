# Phase 4: Role-Specific Next-Step Affordances and Copy Corrections

## Context Links

- Parent: [plan.md](./plan.md)
- Dependency: [phase-03](./phase-03-apply-and-cv-prerequisite-return-path-recovery.md)
- Relevant files:
  - `../../apps/web/app/dashboard/candidate/page.tsx`
  - `../../apps/web/app/dashboard/candidate/applications/page.tsx`
  - `../../apps/web/components/applications/candidate-applications-table.tsx`
  - `../../apps/web/app/dashboard/recruiter/applications/page.tsx`
  - `../../apps/web/components/applications/recruiter-applications-table.tsx`
  - `../../apps/web/app/dashboard/recruiter/jobs/page.tsx`
  - `../../apps/web/app/dashboard/admin/page.tsx`
  - `../../apps/web/components/dashboard/dashboard-stat-card.tsx`

## Overview

- Priority: P1
- Status: Pending
- Brief: replace dead-end messaging, weak empty states, and misleading summary copy with actions that help the user move.

## Key Insights

- Candidate applications empty state explains the problem but offers no action.
- Recruiter applications empty state is just a shrug.
- Admin dashboard stats are display-only, so they hint at management depth without actual drill-down cues.
- `Visible drafts` is bad copy because the metric is not about visibility.

## Requirements

Functional:

- Add concrete next-step actions to candidate applications empty and low-signal states.
- Add recruiter empty-state actions pointing to existing jobs destinations.
- Improve recruiter jobs summary copy to reflect actual meaning.
- Add admin dashboard drill-down affordances only where a real destination exists today.

Non-functional:

- Do not create fake drill-downs for routes that do not exist.
- Keep copy plain and specific.
- Reuse existing button, empty-state, and stat-card primitives.

## Architecture

This phase is content and action wiring, not structural redesign:

`dashboard/list page -> clearer action cluster -> empty-state CTA -> existing destination`

If a destination does not exist, the card should stop pretending it is actionable.

## Related Code Files

Modify:

- `apps/web/app/dashboard/candidate/page.tsx`
- `apps/web/app/dashboard/candidate/applications/page.tsx`
- `apps/web/components/applications/candidate-applications-table.tsx`
- `apps/web/app/dashboard/recruiter/applications/page.tsx`
- `apps/web/components/applications/recruiter-applications-table.tsx`
- `apps/web/app/dashboard/recruiter/jobs/page.tsx`
- `apps/web/app/dashboard/admin/page.tsx`
- `apps/web/components/dashboard/dashboard-stat-card.tsx`

## Implementation Steps

1. Add useful empty-state actions to candidate applications based on existing destinations.
2. Add recruiter applications empty-state actions for `View jobs` and `Create or upload job` flows.
3. Correct recruiter jobs metric label and helper copy.
4. Review candidate dashboard action cluster so it aligns with the new jobs-route continuity.
5. Add admin stat-card affordance pattern only for routes that exist now, likely `Manage users`.
6. Remove or soften any card wording that implies unsupported drill-downs.

## Todo List

- [ ] Add candidate applications next-step CTAs.
- [ ] Add recruiter applications next-step CTAs.
- [ ] Fix recruiter jobs summary copy.
- [ ] Add real admin drill-down affordances where possible.

## Success Criteria

- Empty states move the user somewhere useful.
- Metric labels match actual meaning.
- Admin dashboard no longer teases fake navigation depth.

## Risk Assessment

- Risk: adding too many buttons and cluttering the pages.
- Mitigation: one primary next step, one secondary at most.

## Security Considerations

- Drill-down actions must only target already authorized routes.
- Do not expose admin-only navigation outside admin surfaces.

## Next Steps

- Lock down active-state correctness and run the full route regression sweep in Phase 5.