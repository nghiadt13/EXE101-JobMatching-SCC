# Phase 3: UI Binding and Interactive Save/Unsave

Status: Proposed

## Goal

Replace hardcoded homepage blocks with real API-driven rendering and wire save/unsave interactions.

## Tasks

1. Refactor `apps/web/components/home/homepage-main.tsx`:
   - accept typed `homepageData` prop
   - remove hardcoded arrays for dynamic sections
2. Bind API fields to sections:
   - hero (headline, subheadline, image, keywords)
   - market stats and date
   - growth series labels/values
   - demand by industry bars/legend
   - trusted companies logos/icons
   - categories grid
   - location filter pills
   - featured jobs cards
   - footer links/social
3. Save/unsave behavior:
   - on heart click, optimistic toggle in local state
   - call `/jobs/:id/save` or `DELETE /jobs/:id/save`
   - rollback local state on API failure
4. Keep existing visual design unchanged.

## Deliverables

- Data-driven homepage rendering
- Functional save/unsave heart action

## Exit Criteria

- Homepage displays backend data in all dynamic sections.
- Save/unsave works for authenticated users and fails gracefully for guests.

