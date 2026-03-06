# Phase 2: Backend AI Normalization Services (CV + JD)

## Context Links

- [Plan Overview](./plan.md)
- [CV AI Parser Service](../../apps/api/src/cvs/services/cv-ai-parser.service.ts)
- [CV Service](../../apps/api/src/cvs/cvs.service.ts)
- [Jobs Service](../../apps/api/src/jobs/jobs.service.ts)

## Overview

**Priority:** P1  
**Status:** Completed  
**Estimate:** 6h

Build reusable AI normalizer so CV text and Job text go through same extraction contract.

## Requirements

- Create generic `AiNormalizationService` with:
  - prompt templates per domain (`cv`, `job`)
  - strict JSON extraction
  - retry/repair once
  - timeout + fallback
- Support Vietnamese + English heading variants.
- Output always normalized to schema v1.

## Implementation Steps

1. Introduce shared AI client wrapper (`GeminiClientService`) with timeout/retry policy.
2. Implement `normalizeCv(rawText)` and `normalizeJob(rawText)` returning same core schema.
3. Implement fallback parser dictionaries for both CV and JD.
4. Add telemetry fields (`source`, `fallbackUsed`, `latencyMs`).

## Files To Modify

- `apps/api/src/cvs/services/cv-ai-parser.service.ts` (refactor or replace)
- `apps/api/src/jobs/*` (hook job normalization)
- `apps/api/src/*/services` new shared normalization modules

## Success Criteria

- [x] CV/JD normalization returns schema-valid payload in all paths.
- [x] Parser no longer depends on static single-language key names.

## Unresolved Questions

- None.
