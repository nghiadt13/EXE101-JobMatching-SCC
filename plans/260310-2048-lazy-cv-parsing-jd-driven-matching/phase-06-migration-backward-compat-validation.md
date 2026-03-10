# Phase 6: Migration, Backward Compat, and Validation

## Context Links

- [plan.md](./plan.md)
- [All previous phases]

## Overview

- **Priority:** P2
- **Status:** Pending
- **Effort:** 2h

Handle migration of existing data, backward compatibility guarantees, docs updates, and final validation.

## Key Insights

- Existing CVs have `candidateProfile` populated, new CVs won't → need version-aware code
- Existing JDs have `requirementsSchema` V1, new JDs can use V2 → lazy migration
- Existing Applications have `matchingSnapshot` V1 → must render correctly alongside V2

## Requirements

### Functional

- Old CVs with `candidateProfile` still work when applying to V1 JDs
- Old CVs applying to V2 JDs → fallback text extraction from file → new pipeline
- JD schema upgrade is lazy: JDs only get V2 schema when HR re-edits/creates new JD
- No batch migration required for MVP
- Seed data updated to demonstrate new flow

### Non-Functional

- No data loss during migration
- All builds, lints, tests pass

## Implementation Steps

1. **Backfill rawText for existing CVs (optional script)**
   - Script that reads existing CVs, extracts text from file, sets rawText
   - NOT required for MVP — fallback extraction handles this
   - Useful for performance (avoid re-extraction at apply time)

   ```typescript
   // scripts/backfill-cv-rawtext.ts
   const cvs = await prisma.cV.findMany({
     where: { rawText: null, deletedAt: null },
   });
   for (const cv of cvs) {
     const text = await extractTextFromFile(cv.filePath);
     await prisma.cV.update({
       where: { id: cv.id },
       data: { rawText: text.slice(0, 50_000) },
     });
   }
   ```

2. **Update seed data**
   - New seed creates JDs with RequirementsSchemaV2
   - New seed creates CVs with rawText populated (no candidateProfile)
   - Keep some legacy seed data for backward compat testing

3. **Version-aware display logic**
   - Frontend snapshot component checks `snapshot.version`:
     - `schema_v1` → existing display
     - `matching_snapshot_v2` → new V2 display
   - Graceful fallback if version unknown: show raw score only

4. **Update documentation**
   - `docs/04-matching-algorithm.md` — add V2 pipeline section
   - `docs/02-database-schema.md` — add rawText column
   - `README.md` — update AI parse workflow description

5. **Final validation checklist**
   - Upload CV → no LLM call → file stored with rawText
   - Create JD → V2 schema generated
   - Apply to V2 JD → LLM evaluation → score persisted
   - Apply to V1 JD (legacy) → existing pipeline → score persisted
   - Old CV + V2 JD → fallback text extraction → score persisted
   - Recruiter view V2 application → shows requirement evaluations + constraints
   - Recruiter view V1 application → shows existing format
   - All builds pass
   - All existing tests pass

## Todo List

- [ ] Create optional rawText backfill script
- [ ] Update seed data for V2 flow
- [ ] Add version-aware display fallback
- [ ] Update docs/04-matching-algorithm.md
- [ ] Update docs/02-database-schema.md
- [ ] Update README.md AI workflow section
- [ ] Run full validation checklist
- [ ] Verify `npm run build -w api` passes
- [ ] Verify `npm run build -w web` passes
- [ ] Verify `npm run lint -w api` passes
- [ ] Verify `npm run lint -w web` passes

## Success Criteria

- Full E2E flow works for new data (V2 pipeline)
- Old data renders without errors (V1 backward compat)
- Docs accurately reflect new architecture
- All quality gates pass
- Seed data demonstrates both V1 and V2 flows

## Risk Assessment

- **Low risk**: Migration is lazy, no batch processing needed
- **Low risk**: Backward compat is handled by version routing, not data transformation

## Security Considerations

- Backfill script runs server-side only, no external access
- No new security surface

## Next Steps

- Future iteration: async apply with job queue (defer if latency becomes issue)
- Future iteration: batch backfill rawText for all legacy CVs
- Future iteration: JD V2 schema auto-upgrade for existing published jobs
