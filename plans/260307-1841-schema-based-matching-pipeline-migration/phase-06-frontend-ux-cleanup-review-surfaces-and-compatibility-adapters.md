# Phase 6: Frontend UX Cleanup, Review Surfaces, And Compatibility Adapters

## Context Links

- [Plan Overview](./plan.md)
- [Jobs Client](../../apps/web/lib/jobs-client.ts)
- [CV Client](../../apps/web/lib/cv-client.ts)
- [Applications Client](../../apps/web/lib/applications-client.ts)
- [Recruiter Job Detail Page](../../apps/web/app/dashboard/recruiter/jobs/[id]/page.tsx)
- [Candidate CV Page](../../apps/web/app/dashboard/candidate/cvs/page.tsx)

## Overview

**Priority:** P1  
**Status:** Complete  
**Estimate:** 5h

Replace frontend assumptions tied to TF-IDF + matched/missing skills with schema-based review and explanation UI, while preserving stable upload and apply flows.

## Key Insights

- Upload pages themselves are mostly stable; the main UI change is in review and application explanation surfaces.
- Current recruiter and candidate application tables only show total score plus warnings, so the visual cutover is manageable.
- Client types are the real compatibility surface.

## Requirements

### Functional

- Job review UI must show requirements schema, not only parsed summary/skills.
- CV review UI must show candidate profile fields relevant to evaluation.
- Application tables must render mixed snapshot versions.

### Non-Functional

- Do not add complex new workflow steps for recruiters or candidates.
- Keep API error handling and request-id display unchanged.

## Related Code Files

### Files To Modify

- `apps/web/lib/jobs-client.ts`
- `apps/web/lib/cv-client.ts`
- `apps/web/lib/applications-client.ts`
- `apps/web/app/dashboard/recruiter/jobs/page.tsx`
- `apps/web/app/dashboard/recruiter/jobs/[id]/page.tsx`
- `apps/web/app/dashboard/candidate/cvs/page.tsx`
- `apps/web/components/jobs/recruiter-job-form.tsx`
- `apps/web/components/cv/cv-list.tsx`
- `apps/web/components/cv/cv-edit-form.tsx`
- `apps/web/components/applications/recruiter-applications-table.tsx`
- `apps/web/components/applications/candidate-applications-table.tsx`

### Files To Delete Or Replace

- Replace `MatchingSnapshot` type shaped only around `componentScores`, `topMatchedSkills`, and `missingSkills`
- Remove UI copy referencing TF-IDF or exact skill matching

## Implementation Steps

1. Add snapshot version discriminated unions in web clients.
2. Update recruiter job detail page to review editable requirement groups.
3. Update CV review UI to surface candidate evidence fields and warnings.
4. Update recruiter application table to show:
   - final score
   - top strengths
   - key gaps
   - warnings
5. Update candidate application table to show only safe, concise feedback.
6. Keep candidate apply form unchanged unless schema quality should block apply; if needed, show warnings, not hard blocks, in v1.

## Todo List

- [ ] FE client types support old and new snapshots.
- [ ] Recruiter review screens reflect schema data.
- [ ] Application tables show schema-based explanation.
- [ ] Old TF-IDF wording removed from UI.

## Success Criteria

- Recruiters can understand why a candidate ranked highly without reading raw CV/JD text.
- Candidates still see a stable upload/apply flow.

## Risk Assessment

- **Risk:** Mixed snapshot rendering becomes messy.
- **Mitigation:** dedicated version-aware render helpers and concise fallback UI.

## Security Considerations

- Candidate-facing explanation must not leak recruiter-only criteria or internal scoring knobs.

## Next Steps

- Finish backfill, rollout gates, and docs cleanup after FE adapters are ready.

## Unresolved Questions

- None.