# Phase 2: CV Upload Simplification — Remove Parse-on-Upload

## Context Links

- [plan.md](./plan.md)
- [Current cvs.service.ts](../../apps/api/src/cvs/cvs.service.ts)
- [Prisma schema](../../apps/api/prisma/schema.prisma)

## Overview

- **Priority:** P1
- **Status:** Pending
- **Effort:** 4h

Remove LLM parsing from CV upload flow. CV upload should only: validate file → extract raw text → store file + raw text + basic metadata. No AI normalization call.

## Key Insights

- Current `CvsService.upload()` calls `buildNormalizedCvData()` which calls `aiNormalizationService.normalizeCv()` — this is the LLM call we remove.
- Raw text extraction (`cvTextExtractorService.extract()`) is cheap CPU work — keep at upload time.
- `parsedData`, `skills`, `skillAtoms`, `candidateProfile` fields on CV become empty/minimal at upload time.
- Existing CV list/detail views show parsed skills — need frontend adjustment (Phase 5).

## Requirements

### Functional

- CV upload MUST NOT call LLM
- CV upload MUST extract and persist raw text for later use
- CV upload response time should be < 2 seconds (was 5-15s with LLM)
- Existing CVs with parsed data should continue to work

### Non-Functional

- Raw text capped at 50,000 chars
- Must not break existing CV update/delete/setPrimary flows

## Architecture

### Database Change

Add `rawText` column to CV model:

```prisma
model CV {
  // ... existing fields ...
  rawText     String?  @db.Text    // extracted text from PDF/DOCX, stored for apply-time parsing
  // parsedData, skills, skillAtoms remain but become optional/empty for new uploads
  // candidateProfile removed from upload flow (created at apply time)
}
```

### Upload Flow Change

```
BEFORE:                                AFTER:
file → validate → extract text         file → validate → extract text
     → LLM normalize (5-15s)                → store file + rawText
     → build candidateProfile               → persist with minimal parsedData
     → persist everything                    → done (< 2s)
     → done (5-15s)
```

## Related Code Files

### Files to MODIFY:

- `apps/api/prisma/schema.prisma` — add `rawText` column to CV
- `apps/api/src/cvs/cvs.service.ts` — simplify `upload()`, remove `buildNormalizedCvData()`
- `apps/api/src/cvs/cvs.service.ts` — update `toView()`, `cvViewSelect()` to include rawText
- `apps/api/src/cvs/cvs.types.ts` — update CvView type if needed

### Files to CREATE:

- Migration file via `npx prisma migrate dev --name add_cv_raw_text`

### Files to DELETE:

- None (keep buildNormalizedCvData for now — deprecate, don't delete yet)

## Implementation Steps

1. **Add `rawText` column to Prisma schema**

   ```prisma
   rawText String? @db.Text
   ```

2. **Create and run migration**

   ```bash
   npx prisma migrate dev --name add_cv_raw_text
   ```

3. **Modify `CvsService.upload()`**
   - Extract text using `cvTextExtractorService.extract()` (keep this)
   - Store raw text in `rawText` column
   - Set `parsedData` to minimal stub: `{ parseStatus: 'pending_apply', rawTextLength: N }`
   - Set `skills` to `[]`
   - Set `skillAtoms` to `[]`
   - Set `candidateProfile` to `null`
   - Set `candidateProfileVersion` to `null`
   - Remove call to `buildNormalizedCvData()`

4. **Update `CvsService.upload()` error handling**
   - Keep file validation (size, type)
   - Keep text extraction errors (throw 422 if unreadable)
   - Remove AI normalization error handling (no longer needed at upload)

5. **Update `CvsService.toView()`**
   - Don't send rawText to frontend (large, unnecessary)
   - Add `parseStatus: 'pending'` indicator for CVs without candidateProfile
   - Keep backward compat: existing CVs with parsedData still render properly

6. **Update `CvsService.update()` flow**
   - If candidate manually edits CV metadata, don't trigger LLM re-parse
   - Only update the editable fields

7. **Add rawText to select queries where needed for matching**
   - MatchingService will need to read rawText, but cvViewSelect should NOT include it (too large for list views)

## Todo List

- [ ] Add `rawText` column to Prisma CV model
- [ ] Run migration
- [ ] Simplify `CvsService.upload()` — remove LLM call
- [ ] Update `parsedData` stub for new uploads
- [ ] Update `toView()` for backward compat
- [ ] Update `cvViewSelect()` — exclude rawText from list responses
- [ ] Remove dependency on `AiNormalizationService` from upload path
- [ ] Update `CvsService.update()` — no LLM re-parse
- [ ] Verify existing CV CRUD still works
- [ ] Build passes

## Success Criteria

- CV upload completes in < 2 seconds (no LLM call)
- `rawText` persisted for new CVs
- Existing CVs with full parsedData still display correctly
- CV list/detail API responses don't include rawText blob
- No broken tests from upload flow change

## Risk Assessment

- **Medium risk**: Frontend CV list currently shows `skills` from parsed data. New uploads will have `skills: []`. Phase 5 frontend changes address this.
- **Mitigation**: parsedData stub includes parseStatus flag so frontend can distinguish "not parsed yet" from "parsed with no skills"

## Security Considerations

- `rawText` column stores extracted CV content — same sensitivity as existing `parsedData`
- Ensure rawText is NOT returned in API list responses (only available internally for matching)
- No change to access control — same ownership model

## Next Steps

- Phase 4 wires the new apply-time pipeline that reads CV.rawText
- Phase 5 updates frontend to handle CVs without parsed skills
