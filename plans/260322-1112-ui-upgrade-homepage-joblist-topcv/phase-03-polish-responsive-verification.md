# Phase 3: Polish, Responsive, and Verification

## Context Links

- Related plan: [plan.md](./plan.md)
- Depends on: Phase 1, Phase 2

## Overview

- Priority: P2
- Status: Pending
- Brief: Final polish pass for responsive behavior, visual consistency, and end-to-end verification.

## Implementation Steps

1. Test homepage at mobile (375px), tablet (768px), and desktop (1280px) breakpoints
2. Test job list page at all breakpoints – sidebar should collapse on mobile
3. Verify all links work (CTA buttons, job cards, filter navigation)
4. Run `npm run lint -w web` and fix any issues
5. Run `npm run build -w web` and fix any build errors
6. Browser visual verification

## Todo List

- [ ] Homepage responsive check
- [ ] Job List responsive check (sidebar collapse)
- [ ] Link verification
- [ ] Lint pass
- [ ] Build pass
- [ ] Browser verification

## Success Criteria

- Both pages look good across all breakpoints
- No lint or build errors
- All interactive elements work as expected
