# Phase 4: Mutation Feedback, Toast Coverage, and Async State Polish

## Context Links

- Parent: [plan.md](./plan.md)
- Dependencies:
  - [phase-02](./phase-02-shared-ui-primitives-and-page-composition-cleanup.md)
  - [phase-03](./phase-03-navigation-shell-breadcrumbs-and-route-affordances.md)
- Relevant files:
  - `../../apps/web/app/layout.tsx`
  - `../../apps/web/components/cv/cv-upload-form.tsx`
  - `../../apps/web/components/jobs/jd-upload-form.tsx`
  - `../../apps/web/components/applications/candidate-apply-form.tsx`
  - `../../apps/web/components/profile/profile-form.tsx`

## Overview

- Priority: P1
- Status: Pending
- Brief: make mutations feel trustworthy by standardizing pending, success, failure, and destructive-action feedback.

## Key Insights

- Toast support is already installed but currently only used in the file upload forms for client-side size checks.
- Some pages use inline red banners for fetch failures; others rely on silent redirects or button disabling only.
- Users need confirmation for actions like upload, save, apply, publish, close, set primary, and delete.

## Requirements

Functional:

- Define explicit toast rules for success, generic failure, long-running operations, and informational states.
- Add reusable pending-button behavior for server actions and form submissions.
- Standardize page-level error alert rendering for fetch failures and route-level async boundaries where they already fit the route structure.
- Add confirmation UX for destructive actions where missing.

Non-functional:

- Avoid duplicated success signal patterns such as both toast and inline success banner for the same event.
- Keep field validation errors inline, not in toasts.
- Preserve requestId surfacing where backend failures already provide it.
- Preserve existing redirect/query-param feedback flows unless a later, explicit behavior-change plan replaces them.

## Architecture

Feedback model:

1. field-level validation stays inline
2. mutation success/failure uses toast where the user stays on the same page
3. redirect/query-param driven flows keep their current semantics and may add toast only as a thin enhancement after the route resolves
4. fetch failure uses page-level alert/banner or route boundary, chosen per route family once
5. destructive actions require confirmation before submission

Critical invariants:

- Candidate apply flow keeps current redirect/query-state behavior unless explicitly redesigned later.
- Recruiter job save/edit error rendering keeps current route-state semantics and requestId visibility.
- Toasts must not become the only place a user can learn about a mutation failure that survives navigation.

## Related Code Files

Modify:

- `apps/web/app/layout.tsx`
- upload, apply, profile, job-status, CV list, and admin mutation components

Potential new files:

- `apps/web/components/ui/pending-button.tsx`
- `apps/web/components/ui/confirm-action-dialog.tsx`
- `apps/web/lib/toast.ts`
- `apps/web/app/**/loading.tsx`
- `apps/web/app/**/error.tsx`

## Implementation Steps

1. Write toast usage rules and helper wrappers if needed.
2. Add pending-button and alert primitives.
3. Choose the async/error contract per route family once: inline banner, route boundary, or redirect/query-state.
4. Apply to high-value actions first: CV upload, JD upload, apply, profile save, publish/close job, set primary, delete.
5. Standardize requestId-aware error surfacing where backend already returns it.
6. Audit for duplicate messaging and remove noise.

## Todo List

- [ ] Establish mutation feedback matrix.
- [ ] Add reusable pending and confirmation building blocks.
- [ ] Lock redirect/query-state invariants for apply and recruiter edit flows before refactor.
- [ ] Standardize route-level async/error strategy instead of mixing multiple patterns per route.
- [ ] Expand toast coverage across major mutations.
- [ ] Normalize fetch failure banners and alerts.

## Success Criteria

- The user gets clear feedback for every major mutation.
- Pending states are visible and intentional.
- Failure messaging is clearer without becoming noisy.

## Risk Assessment

- Risk: toast overuse creates spam and hides important context.
- Mitigation: reserve toasts for mutation outcomes and cross-route success confirmation only.

## Security Considerations

- Destructive confirmations must not replace server-side authorization checks.
- Error surfacing must avoid leaking raw internal exceptions.

## Next Steps

- Apply the improved building blocks to the role-based feature flows in Phase 5.