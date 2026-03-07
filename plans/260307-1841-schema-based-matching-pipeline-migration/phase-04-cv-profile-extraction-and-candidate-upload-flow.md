# Phase 4: CV Profile Extraction And Candidate Upload Flow

## Context Links

- [Plan Overview](./plan.md)
- [CV Service](../../apps/api/src/cvs/cvs.service.ts)
- [Candidate CV Page](../../apps/web/app/dashboard/candidate/cvs/page.tsx)
- [CV Upload Form](../../apps/web/components/cv/cv-upload-form.tsx)
- [CV List](../../apps/web/components/cv/cv-list.tsx)

## Overview

**Priority:** P1  
**Status:** Complete  
**Estimate:** 5h

Persist a scoring-oriented candidate profile from CV upload and manual edits while preserving the current candidate upload flow, sync error handling, and edit/review experience.

## Key Insights

- Candidate upload already surfaces parsing failures directly and should keep doing that.
- Current `normalizedProfile` is close to useful, but the new scorer needs more explicit evidence fields for requirement evaluation.
- Candidate UX should remain simple: upload, review, correct. No queue/pending-processing UI unless strictly necessary.

## Requirements

### Functional

- CV upload and CV edit must produce `candidateProfile_v1`.
- Candidate can correct extracted data relevant to evaluation.
- Primary CV selection and apply flow remain unchanged.

### Non-Functional

- Keep upload synchronous.
- Preserve existing request-id error surfacing.

## Candidate Profile Direction

- headline / target role
- summarized experience entries with dates
- explicit skill evidence
- education
- certifications
- languages
- location / work mode hints
- extraction confidence / warnings

## Related Code Files

### Files To Modify

- `apps/api/src/cvs/cvs.service.ts`
- `apps/api/src/normalization/ai-normalization.service.ts`
- `apps/web/app/dashboard/candidate/cvs/page.tsx`
- `apps/web/components/cv/cv-list.tsx`
- `apps/web/components/cv/cv-edit-form.tsx`
- `apps/web/components/cv/cv-upload-form.tsx`
- `apps/web/lib/cv-client.ts`

### Files To Create

- candidate profile validator/mapper
- evidence extraction helpers for experience and skills

### Files To Delete Or Replace

- Replace any assumption that `skills[]` alone is the candidate side matching input

## Implementation Steps

1. Extend CV extraction output to persist `candidateProfile_v1` alongside current parsed data during transition.
2. Ensure manual CV edits update both display fields and candidate profile fields through one mapper.
3. Keep `isPrimary`, list behavior, delete, and set-primary flows unchanged.
4. Update CV detail/list UI to surface evaluation-relevant fields and warnings.
5. Preserve candidate-facing parse error behavior exactly as today.
6. Avoid async job state in the upload UI; use admin/background reprocessing only for migrations or retries.

## Todo List

- [ ] Candidate profile schema persisted on upload.
- [ ] Candidate edit flow updates profile safely.
- [ ] Primary CV and apply flow stay unchanged.
- [ ] Candidate review surface reflects evaluation-ready data.

## Success Criteria

- Candidate can still upload one CV and immediately see whether parsed data needs correction.
- New scorer has enough structured evidence to evaluate experience and requirement fit deterministically.

## Risk Assessment

- **Risk:** Manual edits mutate display data but not scorer input.
- **Mitigation:** single write mapper updates both display and profile payloads.

## Security Considerations

- Do not expose hidden extraction confidence internals beyond safe warning strings.

## Next Steps

- Implement requirement-level evaluation using job schema and candidate profile only.

## Unresolved Questions

- None.