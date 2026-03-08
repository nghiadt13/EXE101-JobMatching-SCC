# Phase 2: Shared UI Primitives and Page Composition Cleanup

## Context Links

- Parent: [plan.md](./plan.md)
- Baseline: [phase-01](./phase-01-ux-baseline-constraints-and-shared-visual-language.md)
- Relevant files:
  - `../../apps/web/components/auth/login-form.tsx`
  - `../../apps/web/components/auth/register-form.tsx`
  - `../../apps/web/components/dashboard/dashboard-stat-card.tsx`
  - `../../apps/web/components/cv/cv-upload-form.tsx`
  - `../../apps/web/components/jobs/jd-upload-form.tsx`

## Overview

- Priority: P1
- Status: Pending
- Brief: extract only the UI primitives that reduce duplication and unlock consistent polish without rewriting feature logic.

## Key Insights

- Button variants are duplicated across most pages and forms.
- Cards, dashed empty states, and status pills already recur enough to justify shared primitives.
- The repo already has `clsx`, `class-variance-authority`, and `tailwind-merge`, so shared component composition can stay lightweight.

## Requirements

Functional:

- Introduce a minimal shared primitive layer for button, card, badge, alert, empty state, loading state, and section header.
- Replace repeated inline class groups where reuse is obvious.
- Keep form validation, form submission, and page fetch logic unchanged.

Non-functional:

- Avoid a giant UI kit.
- Keep primitives generic and narrow.
- Prefer composition over magic wrappers.

## Architecture

The primitive layer should sit below feature components:

`pages -> feature components -> small shared UI primitives`

Do not create a new abstraction over API clients, actions, or page data fetching.

## Related Code Files

Potential new files:

- `apps/web/components/ui/button.tsx`
- `apps/web/components/ui/card.tsx`
- `apps/web/components/ui/badge.tsx`
- `apps/web/components/ui/alert.tsx`
- `apps/web/components/ui/empty-state.tsx`
- `apps/web/components/ui/loading-state.tsx`
- `apps/web/components/ui/page-header.tsx`

Modify:

- Existing auth, CV, jobs, dashboard, and application components that repeat the same class groups.

## Implementation Steps

1. Create the smallest useful primitive set.
2. Migrate low-risk pages first: landing, auth forms, stat cards, upload forms.
3. Replace duplicated button and card styling in feature components.
4. Standardize status pill rendering for parse state, job state, and app state.
5. Leave complicated recruiter and CV list views for later phases once the primitives are proven.

## Todo List

- [ ] Build primitive components with semantic variants.
- [ ] Convert basic pages and forms to use them.
- [ ] Remove obvious style duplication from entry-point surfaces.
- [ ] Document the intended primitive usage in the plan or code comments where needed.

## Success Criteria

- Shared primitives cover the majority of repeated UI patterns.
- Page code gets shorter and more readable, not more abstract.
- No feature logic or API signatures change.

## Risk Assessment

- Risk: primitives become too clever and hide layout intent.
- Mitigation: keep variants explicit and small; avoid nested composition layers.

## Security Considerations

- No token, auth, or server action changes.
- Ensure primitives do not accidentally render unsafe HTML or mutate submission behavior.

## Next Steps

- Use the new primitives to rebuild navigation and route affordances in Phase 3.