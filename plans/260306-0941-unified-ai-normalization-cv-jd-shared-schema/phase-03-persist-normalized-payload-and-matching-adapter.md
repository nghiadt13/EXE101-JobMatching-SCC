# Phase 3: Persist Normalized Payload And Matching Adapter

## Context Links

- [Plan Overview](./plan.md)
- [CV Service](../../apps/api/src/cvs/cvs.service.ts)
- [Jobs Service](../../apps/api/src/jobs/jobs.service.ts)
- [Matching Service](../../apps/api/src/matching/matching.service.ts)

## Overview

**Priority:** P1  
**Status:** Completed  
**Estimate:** 4h

Persist normalized payload for both entities and switch matching input to unified schema.

## Requirements

- CV and Job records store normalized JSON + schemaVersion + parse status.
- Matching service reads normalized blocks first, fallback to legacy when missing.
- Keep deterministic scoring output contract unchanged for MVP.

## Implementation Steps

1. Add persistence fields (or reuse existing JSON fields with versioned envelope).
2. Update create/update flows for CV/Job to persist normalized result.
3. Refactor matching text/skills extraction from unified schema adapter.
4. Add migration script for existing rows (best-effort backfill on first read).

## Success Criteria

- [x] New and old data both matchable.
- [x] Matching quality improves on multilingual/variant CV-JD headings.

## Unresolved Questions

- None.
