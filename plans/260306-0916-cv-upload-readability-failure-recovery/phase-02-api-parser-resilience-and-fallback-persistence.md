# Phase 2: API Parser Resilience And Fallback Persistence

## Context Links

- [Plan Overview](./plan.md)
- [CV Service](../../apps/api/src/cvs/cvs.service.ts)
- [Text Extractor](../../apps/api/src/cvs/services/cv-text-extractor.service.ts)
- [AI Parser](../../apps/api/src/cvs/services/cv-ai-parser.service.ts)

## Overview

**Priority:** P1  
**Status:** Pending  
**Estimate:** 3h

Refactor upload pipeline so parser limitations do not block valid uploads.

## Requirements

- Valid PDF/DOCX uploads should persist CV even if extraction/AI parsing fails.
- Parsed payload must remain schema-safe (`skills`, `summary`, `experience`, `education`, `contact`).
- Response should include a warning signal for degraded parse (field or marker strategy).

## Implementation Steps

1. Split upload pipeline into stages: validate -> store -> parse -> persist/update fallback.
2. On extraction/AI failure, use deterministic fallback parsedData and empty skills.
3. Keep rejection only for:
   - missing file
   - unsupported type
   - file too large
   - totally unreadable/corrupt binary not matching supported type policy
4. Add structured warning indicator for frontend rendering.

## Files To Modify

- `apps/api/src/cvs/cvs.service.ts`
- `apps/api/src/cvs/services/cv-text-extractor.service.ts`
- `apps/api/src/cvs/cvs.types.ts` (if warning field added)

## Success Criteria

- [ ] Parse-limited file no longer returns blocking 422 by default path.
- [ ] API response contract stays backward-compatible or has coordinated FE update.

## Unresolved Questions

- Whether warning indicator should be a dedicated field or encoded inside `parsedData.meta`.
