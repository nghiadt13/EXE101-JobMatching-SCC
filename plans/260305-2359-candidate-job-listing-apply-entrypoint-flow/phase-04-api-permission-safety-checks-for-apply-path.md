# Phase 4: API Permission Safety Checks For Apply Path

## Context Links

- [Plan Overview](./plan.md)
- [Applications Controller](../../apps/api/src/applications/applications.controller.ts)
- [Applications Service](../../apps/api/src/applications/applications.service.ts)

## Overview

**Priority:** P1  
**Status:** ✅ Completed  
**Estimate:** 1h

Validate backend still enforces candidate-only apply and duplicate safety.

## Requirements

### Functional

- Verify `POST /applications` remains restricted to `CANDIDATE`.
- Verify duplicate apply keeps mapping to `409`.
- Verify only published and visible jobs are apply-able.

### Non-functional

- Prefer targeted tests over broad refactor.
- Keep existing behavior backward compatible.

## Todo List

- [x] Permission/visibility checks re-verified.
- [x] Duplicate race mapping re-verified.
- [x] Regression tests updated if needed.

## Unresolved Questions

- None.
