# Red Team Review

## Reviewer: Hostile Architect

### Finding 1: Phase 1 — Languages sync không đủ sâu

**Severity:** Medium

`update()` method chỉ sync `languages` khi `parsedData.languages` tồn tại trong merged data. Nhưng `updateAction` trên FE gửi `parsedData: { summary, languages }` → shallow merge với existing `parsedData`. Nếu user submit form với languages rỗng → `mergedParsedData['languages']` = `[]` → `Array.isArray([])` = true → sync empty array. Đây là **behavior đúng**, nhưng cần document rõ.

**Resolution:** ✅ Acceptable. Empty array = xóa hết languages = đúng ý user.

### Finding 2: Phase 2 — `<details>` element accessibility

**Severity:** Low

`<details>/<summary>` là native HTML nhưng không tất cả screen readers hỗ trợ tốt. Trên Safari cũ (< 14) animation không smooth.

**Resolution:** ✅ Acceptable cho MVP. Sau này có thể thêm Client Component nếu cần animation.

### Finding 3: Phase 2 — `rawQuality.score` có thể gây hiểu lầm

**Severity:** Medium

Quality score do AI estimate → có thể không chính xác. Hiển thị cho candidate có thể gây confusion ("Tại sao CV tôi chỉ 60 điểm?").

**Resolution:** 🔄 **Revised plan**: Chỉ hiển thị score badge khi `parseStatus !== 'parsed_ok'` hoặc ẩn hoàn toàn score, chỉ giữ parse status badge. Cân nhắc chỉ hiển thị cho admin/recruiter view.

→ **Đề xuất:** Bỏ hiển thị `score` cho candidate view. Giữ `parseStatus` badge là đủ. Thêm score hiển thị vào recruiter view sau.

### Finding 4: Phase 3 — Race condition khi edit

**Severity:** Low

Nếu 2 tab cùng edit CV → tab sau sẽ ghi đè data tab trước. Nhưng đây là existing behavior, không phải regression.

**Resolution:** ✅ Not in scope. Existing issue.

### Finding 5: Phase 2 — CvItem type change backward compat

**Severity:** Low

Thêm `location` và `rawQuality` optional vào `normalizedProfile` type → backward compatible vì optional fields. API response đã có data này (từ `toView()` trong `cvs.service.ts`).

**Resolution:** ✅ Safe.

## Summary

| # | Finding | Severity | Action |
|---|---------|----------|--------|
| 1 | Empty languages array behavior | Medium | ✅ Document, acceptable |
| 2 | `<details>` accessibility | Low | ✅ Acceptable cho MVP |
| 3 | Quality score hiển thị cho candidate | Medium | 🔄 **Bỏ score badge cho candidate**, chỉ giữ parseStatus |
| 4 | Race condition 2 tabs | Low | ✅ Not in scope |
| 5 | Type backward compat | Low | ✅ Safe |

## Plan Adjustments

- Phase 2, step 2.2: **Bỏ quality score badge cho candidate view**. Chỉ hiển thị `parseStatus` badge.
- Phase 2: Bỏ thêm `rawQuality` vào `CvItem` type (không cần cho candidate view).
