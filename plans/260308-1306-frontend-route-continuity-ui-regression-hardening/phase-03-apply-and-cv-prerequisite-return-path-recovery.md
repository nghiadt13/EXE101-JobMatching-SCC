# Phase 3: Apply and CV Prerequisite Return-Path Recovery

## Context Links

- Parent: [plan.md](./plan.md)
- Dependency: [phase-02](./phase-02-session-aware-jobs-framing-and-shell-continuity.md)
- Relevant files:
  - `../../apps/web/app/jobs/[slug]/page.tsx`
  - `../../apps/web/components/applications/candidate-apply-form.tsx`
  - `../../apps/web/app/dashboard/candidate/cvs/page.tsx`
  - `../../apps/web/components/cv/cv-upload-form.tsx`
  - `../../apps/web/components/cv/cv-list.tsx`

## Overview

- Priority: P1
- Status: Pending
- Brief: preserve job-return context when candidate users hit missing-CV or apply-precondition branches.

## Key Insights

- Job detail has a CV prerequisite message, but the current link to CV management does not preserve return intent.
- Without return context, the user is forced to remember where they came from.
- This is exactly the kind of friction that kills conversion in a candidate flow.

## Requirements

Functional:

- Carry the originating job route into the CV prerequisite path.
- Surface clear return affordances after CV upload or CV selection tasks where feasible with current route structure.
- Keep apply success and error feedback on the job-detail route.
- Avoid inventing new candidate-only job routes.

Non-functional:

- Do not change application API calls.
- Do not change CV business rules such as primary selection.
- Prefer query-param continuity over stateful client-only hacks.

## Architecture

Use explicit return context:

`job detail -> CV prerequisite link with return target -> candidate CV management page reads return target -> user completes action -> explicit return CTA`

Do not promise automatic deep restoration if the current CV forms do not support it cleanly. Explicit return CTA is acceptable and more reliable.

## Related Code Files

Modify:

- `apps/web/app/jobs/[slug]/page.tsx`
- `apps/web/components/applications/candidate-apply-form.tsx`
- `apps/web/app/dashboard/candidate/cvs/page.tsx`
- `apps/web/components/cv/cv-upload-form.tsx`
- `apps/web/components/cv/cv-list.tsx`

## Implementation Steps

1. Define one return-context query key for candidate prerequisite flows.
2. Attach the return target to the missing-CV CTA from job detail.
3. Read that target on the CV management page.
4. Add a clear `Return to job` affordance in the CV page header or success area when the query key is present.
5. Keep apply success and error messages on the original job detail path.
6. Verify duplicate-apply and missing-CV branches still resolve to the correct route.

## Todo List

- [ ] Define a single return-context query key.
- [ ] Preserve return target from job detail to CV management.
- [ ] Add explicit return CTA from candidate CV management.
- [ ] Verify apply success and error branches keep original context.

## Success Criteria

- Candidate can recover from missing CV without losing the originating job context.
- CV prerequisite path no longer strands the user in dashboard CV management.
- Existing CV and application business rules still behave the same.

## Risk Assessment

- Risk: scattering multiple query key names across forms and pages.
- Mitigation: define one continuity pattern and reuse it.

## Security Considerations

- Return targets must stay internal.
- No sensitive state should be encoded beyond route context.

## Next Steps

- Improve next actions and drill-down affordances on role-specific list and dashboard pages in Phase 4.