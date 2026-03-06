# Phase 1: Shared Schema Contract And Migration Strategy

## Context Links

- [Plan Overview](./plan.md)
- [CV Types](../../apps/api/src/cvs/cvs.types.ts)
- [Job Types](../../apps/api/src/jobs/jobs.types.ts)
- [Matching Service](../../apps/api/src/matching/matching.service.ts)

## Overview

**Priority:** P1  
**Status:** Completed  
**Estimate:** 3h

Define 1 schema contract cho cả CV/JD và migration path không phá flow hiện tại.

## Requirements

- Chốt `normalizedProfile` schema v1 + validation rules.
- Chốt data ownership: field nào editable bởi user, field nào AI-only.
- Thiết kế backward compatibility với rows hiện có.

## Implementation Steps

1. Add shared TypeScript schema types in API (`shared/normalization`).
2. Define DTO/response shape cho parse status (`ok|fallback|needs_review`).
3. Document mapping from current fields -> schema v1.
4. Define migration strategy (no destructive migration in first pass).

## Success Criteria

- [x] Schema v1 approved and versioned.
- [x] Compatibility approach for existing CV/Job records documented.

## Unresolved Questions

- None.
