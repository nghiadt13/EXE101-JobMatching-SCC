# Phase 1: Fix Languages Sync trên Backend

## Context

- [plan.md](./plan.md)
- [cvs.service.ts](../../apps/api/src/cvs/cvs.service.ts)
- [update-cv.dto.ts](../../apps/api/src/cvs/dto/update-cv.dto.ts)
- [page.tsx](../../apps/web/app/dashboard/candidate/cvs/page.tsx)

## Overview

- **Priority:** High
- **Status:** Pending
- **Description:** Khi candidate edit languages trong form, giá trị chỉ lưu vào `parsedData.languages` nhưng không sync sang `normalizedProfile.languages`. Cần fix để 2 nơi luôn đồng bộ.

## Key Insights

- `normalizedProfile` nằm lồng trong `parsedData` (JSON column trong DB: `parsedData.normalizedProfile`)
- Backend `update()` đã có pattern sync cho `skills` và `summary` → chỉ cần thêm `languages` theo cùng pattern
- Không ảnh hưởng upload flow (upload flow tạo `normalizedProfile` đầy đủ từ AI)

## Requirements

### Functional
- Khi `parsedData.languages` được update qua PATCH endpoint → tự động sync vào `parsedData.normalizedProfile.languages`
- Giữ nguyên behavior cho `skills` và `summary` (đã hoạt động)

### Non-functional
- Không thay đổi DB schema
- Backward compatible (CV cũ không bị ảnh hưởng)

## Related Code Files

| File | Action | Description |
|------|--------|-------------|
| `apps/api/src/cvs/cvs.service.ts` | **Modify** | Thêm languages sync logic trong method `update()` |

## Implementation Steps

1. **Mở `cvs.service.ts`**, tìm method `update()` (line 153-213)

2. **Thêm sync logic cho languages** sau block sync `summary` (line 187-197):

```typescript
// Existing: sync summary → normalizedProfile.summary
if (typeof mergedParsedData['summary'] === 'string') {
  // ... existing code
}

// NEW: sync languages → normalizedProfile.languages
if (Array.isArray(mergedParsedData['languages'])) {
  const normalizedProfile = this.asRecord(
    mergedParsedData['normalizedProfile'],
  );
  if (Object.keys(normalizedProfile).length > 0) {
    mergedParsedData['normalizedProfile'] = {
      ...normalizedProfile,
      languages: mergedParsedData['languages'],
    };
  }
}
```

3. **Verify** với existing test file `cvs.service.spec.ts` — chạy test để đảm bảo không regression

## Todo List

- [ ] Thêm languages sync trong `cvs.service.ts → update()`
- [ ] Chạy existing tests: `npm test -- --testPathPattern=cvs.service`
- [ ] Manual test: edit languages → verify `normalizedProfile.languages` updated

## Success Criteria

- PATCH `/api/cvs/:id` với `{ parsedData: { languages: ["English", "Vietnamese"] } }` → response trả về `normalizedProfile.languages` = `["English", "Vietnamese"]`
- Existing tests pass
- Upload flow không bị ảnh hưởng

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Break existing skills/summary sync | Medium | Thêm code SAU block hiện tại, không modify existing |
| CV cũ không có normalizedProfile | Low | Guard `if (Object.keys(normalizedProfile).length > 0)` đã xử lý |

## Next Steps

- Sau khi backend fix → Phase 2 (FE improvement) có thể tin tưởng `normalizedProfile` luôn đúng
