# Phase 5: Frontend Adaptation — CV Upload UX and Application Display

## Context Links

- [plan.md](./plan.md)
- [Phase 2 — CV upload changes](./phase-02-cv-upload-simplification.md)
- [Phase 4 — Application flow](./phase-04-application-flow-integration.md)

## Overview

- **Priority:** P2
- **Status:** Pending
- **Effort:** 4h

Adapt frontend for two changes:

1. CV upload no longer shows parsed skills/profile immediately (because no LLM parse at upload)
2. Application detail shows new MatchingSnapshotV2 format with requirement evaluations + constraint flags

## Key Insights

- CV list currently shows skills extracted from parsedData. New CVs will have `skills: []`. Need to show "Skills will be evaluated when you apply" messaging.
- Apply button now triggers a longer operation (LLM call). Need loading state.
- Recruiter application view needs to display V2 snapshot (constraint flags, importance levels) alongside V1 backward compat.

## Requirements

### Functional

- CV upload success → show file info + "Skills will be analyzed when you apply to a job"
- CV list → existing CVs show skills normally, new CVs show "pending analysis" state
- Apply button → loading indicator with "Analyzing your CV for this position..." message
- Application detail (recruiter) → show requirement evaluations with importance levels, constraint flags
- Application detail → backward compat: render V1 snapshots with existing component

### Non-Functional

- No layout shifts during loading
- Responsive on mobile

## Related Code Files

### Files to MODIFY:

- `apps/web/components/cv/cv-upload-form.tsx` — remove skill display expectation, add "pending" message
- `apps/web/components/cv/cv-list.tsx` — handle CVs with empty skills
- `apps/web/app/jobs/[slug]/page.tsx` or apply button component — add loading state
- `apps/web/components/applications/recruiter-applications-table.tsx` — render V2 snapshot
- `apps/web/components/applications/candidate-applications-table.tsx` — render V2 snapshot for candidate view

### Files to POTENTIALLY CREATE:

- `apps/web/components/matching/matching-snapshot-v2.tsx` — V2 snapshot display component
- `apps/web/components/matching/constraint-flags.tsx` — constraint result display

## Implementation Steps

1. **CV Upload Form**
   - After successful upload, show file info (name, size, date) only
   - Remove "Parsed Skills" section for new uploads
   - Add info banner: "Your CV will be analyzed when you apply to specific jobs for more accurate matching"

2. **CV List Component**
   - Check if `skills` array is empty AND parseStatus is 'pending_apply'
   - If so: show "Pending job-specific analysis" badge instead of skills tags
   - Existing CVs with skills → display normally (backward compat)

3. **Apply Button / Flow**
   - Add loading state with progress message: "Analyzing your CV for this position..."
   - Increase timeout for apply API call (from default to ~45s)
   - Handle error: show retry option with message from backend

4. **MatchingSnapshotV2 Display Component**
   - Create `matching-snapshot-v2.tsx`:
     - Score breakdown: skill_score, constraint_score, final
     - Requirements list with: label, importance level badge, status badge, evidence
     - Constraints section: met/failed with flag for HR review
     - Strengths and gaps summary
   - Version routing in parent component:
     - `snapshot.version === 'matching_snapshot_v2'` → render V2 component
     - else → render existing V1 component

5. **Constraint Flags for HR**
   - If any constraints failed: show yellow banner "⚠️ Some hard constraints not met — flagged for manual review"
   - List failed constraints with evidence
   - Align with matching policy: "Hard constraints do not auto-drop the candidate"

6. **Importance Level Badge Colors**
   - `critical` → red
   - `high` → orange
   - `medium` → blue
   - `low` → gray
   - `very_low` → light gray

## Todo List

- [ ] Update CV upload form — remove parsed skills display
- [ ] Add "pending analysis" messaging for new CVs
- [ ] Update CV list — handle empty skills gracefully
- [ ] Add apply button loading state with extended timeout
- [ ] Create MatchingSnapshotV2 display component
- [ ] Add version routing for snapshot display
- [ ] Create constraint flags display
- [ ] Add importance level badges
- [ ] Test backward compat with V1 applications
- [ ] Responsive check

## Success Criteria

- New CV upload shows file info only, no broken skills section
- CV list renders both old (with skills) and new (pending) CVs
- Apply loading state visible during LLM evaluation
- Recruiter sees V2 snapshot with requirements, constraints, importance levels
- Old V1 applications still render correctly
- No console errors from undefined data

## Risk Assessment

- **Medium risk**: Apply timeout may confuse users. Mitigation: clear loading message, consider websocket/polling for progress in future.
- **Low risk**: Snapshot version routing is straightforward if-else.

## Security Considerations

- No new security concerns — same data exposure as current application views

## Next Steps

- Phase 6 handles migration of existing data
