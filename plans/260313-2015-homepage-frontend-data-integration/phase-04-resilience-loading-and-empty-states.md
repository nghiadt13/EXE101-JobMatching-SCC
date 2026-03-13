# Phase 4: Resilience, Loading UX, and Empty States

Status: Proposed

## Goal

Ensure homepage remains stable under API failures, empty datasets, and unauthorized actions.

## Tasks

1. Add loading placeholders for client-only interactive blocks.
2. Add empty state rendering for:
   - no featured jobs
   - no categories
   - no trend/demand data
3. Add recoverable error handling:
   - show non-blocking inline message
   - keep page sections visible with fallback values
4. Handle unauthorized save/unsave:
   - revert optimistic toggle
   - optionally redirect to login or show login prompt.

## Deliverables

- Robust homepage behavior for non-happy paths

## Exit Criteria

- Homepage does not break on empty/partial API responses.
- User interaction errors are handled predictably.

