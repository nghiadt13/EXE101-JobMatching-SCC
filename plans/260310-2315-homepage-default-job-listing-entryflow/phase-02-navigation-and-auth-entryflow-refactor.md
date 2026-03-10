# Phase 2: Navigation and Auth Entryflow Refactor

Status: Completed (2026-03-10)

## Goal

Ensure all user-facing navigation and auth transitions treat homepage listing as default.

## Tasks

1. Update nav items and CTA labels:
   - Replace “Browse jobs” route target from `/jobs` -> `/`.
2. Update route helpers and dashboard quick actions where listing route is referenced.
3. Review login/register flows:
   - Preserve intended callback destination.
   - Avoid auto-redirecting root visitors to role dashboard.
4. Keep explicit dashboard entry buttons for each role.

## Edge Cases

- Candidate clicks apply from detail page and returns back to listing route.
- Recruiter/admin logged in but wants to browse public jobs from root.
- Unauthorized user hits protected dashboard links from new nav.

## Deliverables

- Updated navigation matrix by role.
- Callback behavior matrix (`guest`, `candidate`, `recruiter`, `admin`).

## Implementation Notes

- Updated candidate navigation and UI CTAs to point listing entry to `/`.
- Updated listing-adjacent actions:
  - login page browse link
  - candidate dashboard quick action
  - candidate applications empty state
  - job detail back-to-list links
- Updated login fallback callback destination to `/` when no explicit callback is provided.
