# Phase 3: Recruiter Job Arrays Rendering + Edit UX

## Context Links

- [Plan Overview](./plan.md)
- [Recruiter Jobs Page](../../apps/web/app/dashboard/recruiter/jobs/page.tsx)
- [Recruiter Job Detail](../../apps/web/app/dashboard/recruiter/jobs/[id]/page.tsx)
- [Recruiter Jobs Table](../../apps/web/components/jobs/recruiter-jobs-table.tsx)
- [Jobs Client](../../apps/web/lib/jobs-client.ts)

## Overview

**Priority:** P1  
**Status:** Completed  
**Estimate:** 3h

Mở rộng UI recruiter để hiển thị arrays parse từ JD và cho phép review nhanh trong luồng create/update.

## Requirements

- Render sections:
  - `skills[]`
  - `jobMeta.requirements[]`
  - `jobMeta.benefits[]`
  - `summary`
- Parse status badge xuất hiện ở list + detail.
- UX gọn, không chặn luồng tạo/sửa/publish job.

## Implementation Steps

1. Extend job view rendering block in list/detail with sectioned arrays.
2. Add compact `requirements` and `benefits` list panels in detail page.
3. Keep edit MVP:
   - continue editing source fields (`description`, `skills`)
   - show parsed arrays as review output
4. Add fallback message when parsed arrays empty.

## Success Criteria

- [x] Recruiter thấy output parse structured ngay sau create/update.
- [x] Không ảnh hưởng existing actions: publish/close/delete.

## Unresolved Questions

- None.
