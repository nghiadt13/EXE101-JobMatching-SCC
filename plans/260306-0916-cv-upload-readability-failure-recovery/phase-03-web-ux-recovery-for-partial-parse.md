# Phase 3: Web UX Recovery For Partial Parse

## Context Links

- [Plan Overview](./plan.md)
- [Candidate CV Page](../../apps/web/app/dashboard/candidate/cvs/page.tsx)
- [CV Client](../../apps/web/lib/cv-client.ts)
- [CV List](../../apps/web/components/cv/cv-list.tsx)

## Overview

**Priority:** P1  
**Status:** Pending  
**Estimate:** 1.5h

Show non-blocking warning after upload when parse quality is degraded and guide user to manual edit.

## Requirements

- Success flow should remain success even with parse warning.
- Candidate sees actionable message: upload done, please review/edit skills and summary.
- Existing hard-error messaging kept for true invalid uploads.

## Implementation Steps

1. Extend API client types for optional parse warning/status.
2. Surface warning banner in CV page after upload completion.
3. Ensure no runtime crash path from server actions.

## Success Criteria

- [ ] Candidate can continue workflow after problematic-but-valid CV upload.
- [ ] Messaging clearly separates invalid file vs parse-limited file.

## Unresolved Questions

- None.
