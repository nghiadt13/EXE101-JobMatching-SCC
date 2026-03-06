# Phase 2: Candidate CV Arrays Rendering + Edit UX

## Context Links

- [Plan Overview](./plan.md)
- [Candidate CV Page](../../apps/web/app/dashboard/candidate/cvs/page.tsx)
- [CV List Component](../../apps/web/components/cv/cv-list.tsx)
- [CV Edit Form](../../apps/web/components/cv/cv-edit-form.tsx)
- [CV Client](../../apps/web/lib/cv-client.ts)

## Overview

**Priority:** P1  
**Status:** Completed  
**Estimate:** 3h

Hiển thị đầy đủ parsed sections cho CV theo mảng/object-array, đồng thời giữ UX edit đơn giản cho MVP.

## Requirements

- Render sections:
  - `experience[]`
  - `education[]`
  - `certifications[]`
  - `projects[]`
  - `languages[]`
  - `skills[]`
  - `summary`
- Parse status banner rõ ràng.
- Cho phép update lại `skills`, `summary`, và tối thiểu 1 trường array text-based.

## Implementation Steps

1. Refactor `CvItem` typing để có view model normalized.
2. Add reusable read-only section renderers:
   - chips list for string arrays
   - compact cards for object arrays
3. Extend `CvEditForm`:
   - keep `summary` + `skills`
   - add `languages` (comma/newline mode) as first array-edit field
4. Update server action payload mapping to preserve existing parsed data.

## Success Criteria

- [x] Candidate thấy được các sections dạng array thay vì raw/thiếu dữ liệu.
- [x] Save flow không bị break với record cũ và record mới.

## Unresolved Questions

- None.
