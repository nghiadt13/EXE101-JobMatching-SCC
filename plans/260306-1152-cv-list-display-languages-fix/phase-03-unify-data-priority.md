# Phase 3: Thống Nhất Data Priority Logic

## Context

- [plan.md](./plan.md)
- [cv-list.tsx](../../apps/web/components/cv/cv-list.tsx)
- [cv-edit-form.tsx](../../apps/web/components/cv/cv-edit-form.tsx)

## Overview

- **Priority:** Medium
- **Status:** Pending (blocked by Phase 1, 2)
- **Description:** Thống nhất logic ưu tiên data source giữa `normalizedProfile` vs `parsedData` trên FE

## Key Insights

Hiện tại FE priority logic không nhất quán:

| Field | Current Priority | Correct Priority |
|-------|-----------------|------------------|
| **Skills** | `normalizedProfile.skills` → `cv.skills` | ✅ Đúng |
| **Summary** | `normalizedProfile.summary` → `parsedData.summary` | ✅ Đúng |
| **Languages** | `parsedData.languages` → `normalizedProfile.languages` | ❌ **Ngược** |
| **Certifications** | `normalizedProfile.certifications` → `parsedData.certifications` | ✅ Đúng |
| **Experience** | `normalizedProfile.experience` → `parsedData.experience` | ✅ Đúng |
| **Education** | `normalizedProfile.education` → `parsedData.education` | ✅ Đúng |

**Quy tắc đúng:** `normalizedProfile` > `parsedData` (vì `normalizedProfile` = data đã chuẩn hóa bởi AI + user edit)

Sau Phase 1 fix (languages sync vào normalizedProfile), ta có thể tin tưởng `normalizedProfile.languages` luôn mới nhất → đổi priority cho Languages.

## Requirements

### Functional
- Languages: đổi priority `normalizedProfile.languages` → fallback `parsedData.languages`
- Giữ nguyên priority cho các field khác (đã đúng)
- Edit form cũng ưu tiên `normalizedProfile` data

### Non-functional
- Không thay đổi API response
- Backward compatible

## Related Code Files

| File | Action | Description |
|------|--------|-------------|
| `apps/web/components/cv/cv-list.tsx` | **Modify** | Đổi `preferStringArray` priority cho Languages |
| `apps/web/components/cv/cv-edit-form.tsx` | **Modify** | Đổi languages default value priority |

## Implementation Steps

### 3.1 Fix Languages priority trong `cv-list.tsx`

**Before (line 159-165):**
```tsx
<ChipsSection
  title="Languages"
  items={preferStringArray(
    toStringArray(cv.parsedData.languages),       // ← parsedData first (WRONG)
    cv.normalizedProfile?.languages ?? [],
  )}
/>
```

**After:**
```tsx
<ChipsSection
  title="Languages"
  items={preferStringArray(
    cv.normalizedProfile?.languages ?? [],         // ← normalizedProfile first (CORRECT)
    toStringArray(cv.parsedData.languages),
  )}
/>
```

### 3.2 Fix Languages priority trong `cv-edit-form.tsx`

**Before (line 12-15):**
```tsx
const languages =
  (Array.isArray(cv.parsedData.languages)
    ? cv.parsedData.languages.filter(...)
    : cv.normalizedProfile?.languages) ?? [];
```

**After:**
```tsx
const languages =
  cv.normalizedProfile?.languages?.length
    ? cv.normalizedProfile.languages
    : (Array.isArray(cv.parsedData.languages)
        ? cv.parsedData.languages.filter((item): item is string => typeof item === 'string')
        : []);
```

### 3.3 Xóa helper functions không cần thiết

Nếu sau refactor `toStringArray` và `toRecordArray` không còn dùng → xóa dead code.

Review lại xem `preferStringArray` và `preferRecordArray` có thể simplify:

```tsx
// Simpler helper
function firstNonEmpty<T>(primary: T[], fallback: T[]): T[] {
  return primary.length ? primary : fallback;
}
```

## Todo List

- [ ] Đổi Languages priority trong `cv-list.tsx`
- [ ] Đổi Languages priority trong `cv-edit-form.tsx`
- [ ] Review và xóa dead code helpers nếu có
- [ ] Manual test: upload CV → verify languages hiển thị đúng
- [ ] Manual test: edit languages → verify hiển thị đúng sau save

## Success Criteria

- Tất cả fields đều ưu tiên `normalizedProfile` trước, fallback `parsedData`
- Edit form hiển thị đúng giá trị mới nhất
- Không có UI regression

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| CV cũ không có normalizedProfile | Low | Fallback vẫn hoạt động nhờ `??` operator |
| Languages trống sau đổi priority | Low | Chỉ xảy ra nếu Phase 1 chưa fix → đó là lý do Phase 3 phụ thuộc Phase 1 |
