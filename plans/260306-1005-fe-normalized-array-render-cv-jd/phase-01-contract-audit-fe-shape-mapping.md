# Phase 1: Contract Audit + FE Shape Mapping

## Context Links

- [Plan Overview](./plan.md)
- [CV Client](../../apps/web/lib/cv-client.ts)
- [Jobs Client](../../apps/web/lib/jobs-client.ts)
- [Candidate CV Page](../../apps/web/app/dashboard/candidate/cvs/page.tsx)
- [Recruiter Jobs Pages](../../apps/web/app/dashboard/recruiter/jobs/page.tsx)
- [Recruiter Job Detail](../../apps/web/app/dashboard/recruiter/jobs/[id]/page.tsx)

## Overview

**Priority:** P1  
**Status:** Completed  
**Estimate:** 2h

Audit field availability và chốt 1 shape FE ổn định cho dữ liệu normalized trước khi sửa UI.

## Requirements

- Map đầy đủ keys có thể dùng từ `normalizedProfile`.
- Chốt default/fallback cho record cũ thiếu field.
- Chốt quy ước parse/edit cho field array (chips/list/textarea).

## Implementation Steps

1. Define FE adapter types:
   - `CvNormalizedViewModel`
   - `JobNormalizedViewModel`
2. Build lightweight mapping helpers in clients:
   - normalize `null/undefined` to empty arrays
   - normalize object arrays (`experience`, `education`, `projects`)
3. Add parse status badge mapping table shared.

## Success Criteria

- [x] FE dùng 1 shape thống nhất, không phụ thuộc payload raw.
- [x] Không có runtime error khi mở record legacy thiếu `normalizedProfile`.

## Unresolved Questions

- None.
