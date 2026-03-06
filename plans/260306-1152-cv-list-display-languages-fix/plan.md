---
title: "CV List Display Improvement & Languages Field Fix"
description: "Cải thiện hiển thị CV list cho candidate + fix Languages field không persist đúng vào normalizedProfile"
status: pending
priority: P2
effort: 6h
branch: main
tags: [frontend, backend, bugfix, refactor]
created: 2026-03-06
---

# CV List Display Improvement & Languages Field Fix

## Overview

Cải thiện UX/UI hiển thị danh sách CV tại `/dashboard/candidate/cvs` và fix bug Languages field trong edit form không persist đúng vào `normalizedProfile`.

## Phân Tích Hiện Tại

### Vấn đề 1: CV List hiển thị chưa logic

**File:** `apps/web/components/cv/cv-list.tsx`

- Skills hiển thị inline cùng dòng với parse status badge → thiếu hierarchy
- Edit form luôn hiển thị → chiếm diện tích, gây rối
- Không có collapsible sections cho Experience/Education/Projects
- Thiếu download/view PDF link
- `normalizedProfile.title` không được hiển thị (ví dụ: "Software Engineer")
- `normalizedProfile.location` không được hiển thị
- `normalizedProfile.rawQuality.score` có sẵn nhưng không dùng

### Vấn đề 2: Languages field — purpose & bug

**What is Languages field?**
- `normalizedProfile.languages` = ngôn ngữ ứng viên biết (ví dụ: "English", "Vietnamese", "Japanese")
- **Khác hoàn toàn** với `normalizedProfile.language` (= ngôn ngữ CV: 'vi' | 'en' | 'mixed')
- AI parser (Gemini) trích xuất danh sách ngôn ngữ từ CV text
- Hiển thị dưới dạng chips trong `cv-list.tsx`
- Edit form cho phép candidate chỉnh sửa (comma/new line separated)

**Bug hiện tại (Backend):**

`apps/web/app/dashboard/candidate/cvs/page.tsx` → `updateAction()`:
```typescript
// FE gửi:
await updateCv(token, cvId, {
  skills,
  parsedData: { summary, languages },  // ← languages nằm ở đây
});
```

`apps/api/src/cvs/cvs.service.ts` → `update()`:
- Chỉ sync `skills` và `summary` vào `normalizedProfile`
- **KHÔNG sync `languages` vào `normalizedProfile`**
- Kết quả: sau khi edit, `parsedData.languages` được cập nhật nhưng `normalizedProfile.languages` vẫn giữ giá trị cũ
- FE `cv-list.tsx` dùng `preferStringArray` → ưu tiên `parsedData.languages` nên **hiển thị đúng** tạm thời
- Nhưng nếu có chức năng matching/filtering dựa trên `normalizedProfile.languages` → sẽ dùng data cũ

### Vấn đề 3: Priority logic không nhất quán

Trong `cv-list.tsx`:
- **Languages**: ưu tiên `parsedData.languages` → fallback `normalizedProfile.languages`
- **Certifications**: ưu tiên `normalizedProfile.certifications` → fallback `parsedData.certifications`
- **Skills**: ưu tiên `normalizedProfile.skills` → fallback `cv.skills`

→ Không nhất quán. Nên ưu tiên `normalizedProfile` vì đó là data đã chuẩn hóa.

## Phases

| # | Phase | Status | Effort | Link |
|---|-------|--------|--------|------|
| 1 | Fix Languages sync trên Backend | Pending | 1h | [phase-01](./phase-01-fix-languages-sync-backend.md) |
| 2 | Cải thiện CV List UI | Pending | 3.5h | [phase-02](./phase-02-improve-cv-list-ui.md) |
| 3 | Thống nhất data priority logic | Pending | 1.5h | [phase-03](./phase-03-unify-data-priority.md) |

## Dependencies

- Phase 2, 3 phụ thuộc Phase 1 (backend fix trước → FE logic mới dựa trên data đúng)
- Không cần migration database (data lưu trong JSON column `parsedData`)
