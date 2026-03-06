# Phase 1: Failure Signature Mapping And Guardrails

## Context Links

- [Plan Overview](./plan.md)
- [API CV Service](../../apps/api/src/cvs/cvs.service.ts)
- [Text Extractor](../../apps/api/src/cvs/services/cv-text-extractor.service.ts)
- [Web CV Page](../../apps/web/app/dashboard/candidate/cvs/page.tsx)

## Overview

**Priority:** P1  
**Status:** Pending  
**Estimate:** 1.5h

Identify exact upload failure modes and decide which should block upload vs continue with fallback.

## Requirements

- Capture real exception categories from PDF/DOCX extractor.
- Define decision matrix:
  - reject (`415`, `413`, true corruption)
  - accept with fallback (`201` + parse warning)
- Keep existing security constraints unchanged.

## Implementation Steps

1. Add targeted logging (non-sensitive) around extractor failures.
2. Reproduce with 3 fixture classes: text PDF, scanned/image PDF, problematic DOCX export.
3. Document status mapping table for each failure class.

## Success Criteria

- [ ] Failure matrix approved and unambiguous.
- [ ] No security validation relaxed.

## Unresolved Questions

- None.
