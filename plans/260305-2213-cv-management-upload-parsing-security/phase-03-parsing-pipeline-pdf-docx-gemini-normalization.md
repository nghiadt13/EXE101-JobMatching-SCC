# Phase 3: Parsing Pipeline (PDF/DOCX + Gemini Normalization)

## Context Links

- [Plan Overview](./plan.md)
- [Phase 2](./phase-02-api-cv-module-and-file-storage-flow.md)
- [Docs: Matching Algorithm](../../docs/04-matching-algorithm.md)
- [API Package Dependencies](../../apps/api/package.json)

## Overview

**Priority:** P1  
**Status:** ✅ Completed  
**Estimate:** 3h

Extract text from uploaded CVs and normalize parsed content with Gemini into stable `parsedData` and `skills`.

## Key Insights

- `pdf-parse` and `mammoth` are already installed for extraction.
- `@google/generative-ai` already exists and can be reused for structured parsing.
- Existing `CV` schema can store rich JSON in `parsedData` without migration.
- External AI calls can fail due to timeout/quota; upload must still remain usable.

## Requirements

### Functional

- Add parser pipeline for upload flow:
  - PDF: extract text via `pdf-parse`.
  - DOCX: extract text via `mammoth`.
- Add Gemini parsing service:
  - Input: extracted text.
  - Output normalized to stable JSON shape:
    - `skills: string[]`
    - `experience: unknown[]`
    - `education: unknown[]`
    - `contact: Record<string, unknown>`
    - `summary?: string`
- Normalize and sanitize skills:
  - lowercase compare, dedupe, trim, preserve display casing.
- Fallback behavior:
  - If AI parse fails, persist minimal parsed structure with empty skills and warning metadata.

### Non-functional

- Set timeout for AI parsing to prevent hanging request.
- Limit extracted text size sent to AI to control token/cost.
- Avoid logging raw CV text in production logs.

## Architecture

```text
CV upload
  -> extract text (pdf/docx parser)
  -> normalize raw text (trim/size cap)
  -> Gemini parser service (JSON output)
  -> output sanitizer (skills + parsedData schema)
  -> persist CV.parsedData + CV.skills
```

## Related Code Files

### Files To Modify

- `apps/api/src/cvs/cvs.service.ts`
- `apps/api/src/cvs/cvs.constants.ts`

### Files To Create

- `apps/api/src/cvs/services/cv-text-extractor.service.ts`
- `apps/api/src/cvs/services/cv-ai-parser.service.ts`
- `apps/api/src/cvs/services/cv-parsing-normalizer.service.ts`
- `apps/api/src/cvs/cv-parser.types.ts`

### Files To Delete

- None.

## Implementation Steps

1. Build text-extraction service for PDF and DOCX.
2. Add parser type contracts for normalized CV payload.
3. Implement Gemini parsing service with strict JSON extraction and timeout.
4. Implement normalization service to sanitize and clamp parsed output.
5. Integrate parsing pipeline into upload flow in `CvsService`.
6. Add graceful fallback when extraction or AI parsing fails.
7. Ensure parsed fields are compatible with downstream matching service requirements.

## Todo List

- [ ] PDF/DOCX extraction service implemented.
- [ ] Gemini parser service implemented.
- [ ] Parsed output normalization implemented.
- [ ] Fallback behavior implemented and documented.
- [ ] Upload response includes stable parsed payload.

## Success Criteria

- [ ] Upload endpoint returns parsed data for valid files.
- [ ] Parsing failures do not crash endpoint.
- [ ] Skills output quality is consistent enough for matching phase.

## Risk Assessment

- **Risk:** AI output shape inconsistent or malformed.
- **Mitigation:** JSON schema-style post-parse sanitizer before persistence.

- **Risk:** Slow AI calls degrade UX.
- **Mitigation:** Timeout + bounded text input + fallback minimal parse.

## Security Considerations

- Treat CV content as untrusted input.
- Never execute parsed content; store as data only.
- Prevent prompt-injection effects by enforcing strict output schema and sanitizer.
- Redact or avoid PII-heavy logs from parsing stage.

## Next Steps

- Build candidate-facing CV UI to consume these APIs.

## Unresolved Questions

- None.
