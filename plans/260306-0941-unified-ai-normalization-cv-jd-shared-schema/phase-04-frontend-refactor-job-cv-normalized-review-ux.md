# Phase 4: Frontend Refactor (Job + CV Normalized Review UX)

## Context Links

- [Plan Overview](./plan.md)
- [Recruiter Job Pages](../../apps/web/app/dashboard/recruiter/jobs/page.tsx)
- [Candidate CV Page](../../apps/web/app/dashboard/candidate/cvs/page.tsx)
- [Jobs Client](../../apps/web/lib/jobs-client.ts)
- [CV Client](../../apps/web/lib/cv-client.ts)

## Overview

**Priority:** P1  
**Status:** Completed  
**Estimate:** 5h

Refactor FE to show AI-normalized results for both recruiter JD submit and candidate CV upload.

## Requirements

- Recruiter: after create/update JD, show parsed summary/skills/requirements preview.
- Candidate: after upload CV, show parsed sections (skills, summary, experience, education).
- Allow manual edit overrides before final save/use in matching.
- Distinguish state: `parsed_ok`, `fallback`, `needs_review`.

## Implementation Steps

1. Extend web clients to consume normalized payload and parse status.
2. Refactor forms/components to render normalized sections arrays.
3. Add warning banners and inline edit controls for low-confidence sections.
4. Preserve current navigation/actions and avoid blocking submit flow.

## Success Criteria

- [x] FE reflects same schema for CV and JD.
- [x] User can correct parsed output without leaving page.

## Unresolved Questions

- None.
