# Phase 3: Backend JD Upload Endpoint And Draft Job Creation

## Context Links

- [Plan Overview](./plan.md)
- [Phase 1](./phase-01-contract-provenance-shape-and-persistence-decision.md)
- [CV Service](../../apps/api/src/cvs/cvs.service.ts)
- [Jobs Service](../../apps/api/src/jobs/jobs.service.ts)
- [Jobs Controller](../../apps/api/src/jobs/jobs.controller.ts)

## Overview

**Priority:** P1  
**Status:** Complete  
**Estimate:** 4h  
**Completed:** 2026-03-07

Build the recruiter-only file upload entrypoint that creates a draft Job from a JD document and persists the normalized result in the existing Job model.

## Key Insights

- `CvsService.upload` already demonstrates the right MVP flow: validate -> extract -> normalize -> persist -> cleanup on failure.
- `JobsService.create` already knows how to store normalization metadata in `location.__normalization`; upload should reuse that pattern, not invent another persistence path.
- Slug generation should happen after title fallback is known.
- Upload mapping must respect existing manual DTO limits so the edit page can round-trip uploaded drafts safely.

## Requirements

### Functional

- Add multipart upload endpoint for recruiters.
- Validate JD PDF/DOCX file type and size before extraction.
- Extract text, normalize it via `normalizeJob`, map it into draft Job fields, and persist.
- Save provenance metadata for the uploaded source file.
- Return the standard `JobView` shape used by existing web pages.
- Preserve provenance metadata when the recruiter later edits the draft Job.

### Non-Functional

- Reject unsupported or unreadable files with clear error messages.
- Clean up stored file if DB persistence fails.
- Keep publish/application/matching flows untouched.

## Architecture

```text
JobsController upload endpoint
  -> file interceptor + role guard
  -> JobsService.createFromFile(...)
     -> text extractor
     -> AiNormalizationService.normalizeJob(rawText)
     -> mapper to draft Job fields
     -> slug generation
     -> prisma.job.create(...)
```

## Related Code Files

### Files To Modify

- `apps/api/src/jobs/jobs.controller.ts`
- `apps/api/src/jobs/jobs.service.ts`
- `apps/api/src/jobs/jobs.types.ts`
- `apps/api/src/jobs/jobs.module.ts`

### Files To Create

- `apps/api/src/jobs/services/job-storage.service.ts` or shared storage helper
- `apps/api/src/jobs/services/job-text-extractor.service.ts` or shared extractor helper
- `apps/api/src/jobs/dto/upload-job-file.dto.ts` if parsing helpers are extracted from controller

### Files To Delete

- None.

## Implementation Steps

1. Add a recruiter-only multipart endpoint with `FileInterceptor`.
2. Reuse the shared extraction/storage strategy chosen in the prior phase.
3. Extract raw text and cap processed length to avoid LLM abuse.
4. Call `AiNormalizationService.normalizeJob(rawText)`.
5. Map normalized output into draft Job fields with explicit truncation/sanitization rules that match manual DTO constraints:
   - `title`
   - `description`
   - `skills`
   - `employmentType`
6. Build normalization metadata with provenance and persist it under `location.__normalization`.
7. Add merge helpers so later `update` calls preserve `sourceDocument` and `inputMode` instead of rebuilding metadata from scratch.
8. Generate slug from normalized title or safe fallback title.
9. Return the usual `JobView` for frontend reuse.

## Todo List

- [x] Multipart recruiter endpoint added.
- [x] JD file validation implemented.
- [x] Draft Job creation from uploaded JD implemented.
- [x] DTO-safe truncation/normalization rules implemented.
- [x] Provenance survives later manual edits.
- [x] Cleanup on DB failure implemented.
- [x] Standard `JobView` response preserved.

## Success Criteria

- Recruiter can upload a valid JD file and receive a new draft Job.
- Invalid files fail early with actionable error messages.
- No separate JD persistence model is introduced.

## Risk Assessment

- **Risk:** Weak normalized title produces bad slug or unreadable draft title.
- **Mitigation:** Apply deterministic fallback title and mark parse status `needs_review`.

- **Risk:** Upload writes file but job create fails.
- **Mitigation:** Mirror CV cleanup behavior with best-effort delete on failure.

## Security Considerations

- Validate both MIME type and extension.
- Enforce recruiter role at controller level.
- Do not trust file names for storage paths.

## Next Steps

- Factor out or align extraction helpers so CV and JD document handling do not diverge.

## Unresolved Questions

- None.