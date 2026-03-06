# Phase 4: Regression Tests And Docs Update

## Context Links

- [Plan Overview](./plan.md)
- [CV Service Spec](../../apps/api/src/cvs/cvs.service.spec.ts)
- [README Troubleshooting](../../README.md)

## Overview

**Priority:** P1  
**Status:** Pending  
**Estimate:** 2h

Lock behavior with tests and document expected outcomes for upload edge cases.

## Requirements

- Unit tests for parser fallback path.
- Integration/e2e checks for status/message behavior.
- README troubleshooting updated with new semantics.

## Implementation Steps

1. Add CV service tests for fallback-accepted uploads.
2. Add extractor tests for parser exception mapping.
3. Run validation: `lint`, `test`, `build` for touched workspaces.
4. Update docs on accepted file classes and manual-recovery flow.

## Success Criteria

- [ ] Automated coverage protects against regression to hard-fail behavior.
- [ ] Team has clear runbook for CV upload parse issues.

## Unresolved Questions

- None.
