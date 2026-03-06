# Phase 2: Cải Thiện CV List UI

## Context

- [plan.md](./plan.md)
- [cv-list.tsx](../../apps/web/components/cv/cv-list.tsx)
- [cv-edit-form.tsx](../../apps/web/components/cv/cv-edit-form.tsx)
- [cv-client.ts](../../apps/web/lib/cv-client.ts)

## Overview

- **Priority:** Medium
- **Status:** Pending (blocked by Phase 1)
- **Description:** Cải thiện layout CV card, thêm thông tin hữu ích, collapsible edit form → UX tốt hơn

## Key Insights

- Data có sẵn nhưng chưa hiển thị: `normalizedProfile.title`, `normalizedProfile.location`, `normalizedProfile.rawQuality.score`
- Edit form luôn mở → chiếm diện tích với mỗi CV card
- Thiếu visual hierarchy: skills cùng dòng với parse status, experience/education flat
- Component `ChipsSection` và `ObjectSection` đã tách rời → dễ refactor

## Requirements

### Functional
- Hiển thị `normalizedProfile.title` (ví dụ: "Software Engineer") dưới filename
- Hiển thị `location` (city, country) nếu có
- ~~Hiển thị quality score badge~~ (Red team: bỏ — AI score gây confusion cho candidate)
- Edit form mặc định ẩn, có nút "Edit" để mở/đóng
- Skills tách ra section riêng thay vì inline
- Experience hiển thị thêm `startDate`, `endDate`

### Non-functional
- Giữ server component (không thêm `'use client'` cho `cv-list.tsx` nếu có thể)
- Responsive trên mobile
- Không break existing actions (setPrimary, delete, update)

## Architecture

### Trước (Current Layout)
```
┌──────────────────────────────────────────┐
│ filename.pdf                             │
│ 256KB - 3/5/2026  [Set primary] [Delete] │
│ [Primary CV] [Parsed OK] [Skill1] ...    │
│ Summary text...                          │
│                                          │
│ Languages    Certifications              │
│ [EN] [VI]    [AWS Cert]                  │
│                                          │
│ Experience       Education               │
│ ┌─────────┐     ┌─────────┐             │
│ │ Role    │     │ Degree  │              │
│ │ Company │     │ School  │              │
│ └─────────┘     └─────────┘             │
│                                          │
│ ┌─ Edit Form (ALWAYS OPEN) ────────────┐│
│ │ Skills: ____________                 ││
│ │ Summary: ____________                ││
│ │ Languages: __________                ││
│ │ [Save parsed data]                   ││
│ └──────────────────────────────────────┘│
└──────────────────────────────────────────┘
```

### Sau (Improved Layout)
```
┌──────────────────────────────────────────┐
│ ┌ Header ─────────────────────────────┐  │
│ │ filename.pdf          [Set primary] │  │
│ │ Software Engineer • HCM, Vietnam   │  │
│ │ 256KB • 3/5/2026                    │  │
│ │ [Primary] [Parsed OK ✓]             │  │
│ └─────────────────────────────────────┘  │
│                                          │
│ Summary text (clamp 2 lines)...          │
│                                          │
│ ┌ Skills ──────────────────────────────┐ │
│ │ [React] [TypeScript] [Node.js] ...  │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ ┌ Details (2-col grid) ────────────────┐ │
│ │ Languages    Certifications          │ │
│ │ [EN] [VI]    [AWS Cert]              │ │
│ │                                      │ │
│ │ Experience       Education           │ │
│ │ ┌──────────┐    ┌──────────┐         │ │
│ │ │Role      │    │Degree    │         │ │
│ │ │Company   │    │School    │         │ │
│ │ │2020-2023 │    │2016-2020 │         │ │
│ │ └──────────┘    └──────────┘         │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ [Edit ▼] [Delete]                        │
│ (Edit form hiện khi click, dùng details) │
└──────────────────────────────────────────┘
```

## Related Code Files

| File | Action | Description |
|------|--------|-------------|
| `apps/web/components/cv/cv-list.tsx` | **Modify** | Cải thiện layout, thêm title/location/score, tách skills section |
| `apps/web/components/cv/cv-edit-form.tsx` | **Modify** | Wrap trong `<details>` element (native HTML, no JS needed) |
| `apps/web/lib/cv-client.ts` | **Modify** | Thêm `location` vào CvItem type |

## Implementation Steps

### 2.1 Update `CvItem` type

File: `apps/web/lib/cv-client.ts`

Thêm fields vào `normalizedProfile`:
```typescript
normalizedProfile: {
  title: string;
  summary: string;
  skills: string[];
  certifications: string[];
  languages: string[];
  projects: Array<{ name: string; description: string; tech: string[] }>;
  experience: Array<Record<string, unknown>>;
  education: Array<Record<string, unknown>>;
  location?: { city: string; country: string };           // NEW
} | null;
```

### 2.2 Cải thiện CV Card header

File: `apps/web/components/cv/cv-list.tsx`

- Hiển thị `normalizedProfile.title` nếu có
- Hiển thị location (format: "city, country") nếu có
- Tách badges ra dòng riêng
- ~~Thêm quality score badge~~ (Red team: removed)

### 2.3 Tách Skills thành section riêng

Thay vì inline trong header badges → tạo `ChipsSection` riêng cho skills:
```tsx
<ChipsSection
  title="Skills"
  items={cv.normalizedProfile?.skills ?? cv.skills}
/>
```

### 2.4 Cải thiện ObjectSection cho Experience

Thêm date range:
```tsx
pickSubtitle={(row) =>
  [
    String(row.company ?? ''),
    row.startDate || row.endDate
      ? `${row.startDate ?? '?'} - ${row.endDate ?? 'Present'}`
      : '',
  ].filter(Boolean).join(' • ')
}
```

### 2.5 Collapsible Edit Form

Dùng HTML native `<details>/<summary>` → server component friendly:
```tsx
<details className="mt-4">
  <summary className="cursor-pointer text-sm font-medium text-zinc-600 hover:text-zinc-900">
    Edit parsed data ▾
  </summary>
  <div className="mt-2">
    <CvEditForm cv={cv} updateAction={updateAction} />
  </div>
</details>
```

### 2.6 Di chuyển Delete button

Move Delete button xuống cạnh Edit → gom actions vào 1 chỗ:
```tsx
<div className="mt-4 flex items-center gap-3">
  <details>...</details>
  <form action={deleteAction}>
    <input type="hidden" name="cvId" value={cv.id} />
    <button type="submit" className="...">Delete</button>
  </form>
</div>
```

## Todo List

- [ ] Update `CvItem` type trong `cv-client.ts`
- [ ] Thêm title + location hiển thị trong CV card header
- [x] ~~Thêm quality score badge~~ (Red team: removed — AI score gây confusion)
- [ ] Tách skills thành section riêng
- [ ] Cải thiện date display cho Experience/Education
- [ ] Wrap edit form trong `<details>/<summary>`
- [ ] Di chuyển action buttons
- [ ] Test responsive trên mobile viewport

## Success Criteria

- CV card hiển thị title, location khi có data
- Skills nằm section riêng, không inline với badges
- Edit form mặc định ẩn, click mở
- All actions (set primary, delete, save edit) vẫn hoạt động
- Layout responsive trên mobile

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Server component constraint | Medium | Dùng `<details>` native thay vì state |
| CvItem type mismatch với API response | Low | Các field mới optional, backward compatible |
| Break existing form actions | Medium | Test manual sau mỗi bước |

## Next Steps

- Phase 3: Thống nhất data priority logic
