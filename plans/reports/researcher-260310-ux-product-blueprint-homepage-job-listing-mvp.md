# Research Report: UX/Product Blueprint MVP cho Homepage + Job Listing

- Date: 2026-03-10
- Scope: `apps/web/app/page.tsx`, `apps/web/app/jobs/page.tsx`, apply flow từ `apps/web/app/jobs/[slug]/page.tsx`
- Skill used: `ck:research`

## 0) Fit với codebase hiện tại (không migration lớn)

- Frontend đang có: App Router + server components, UI primitives (`PageHeader`, `Badge`, `Button`, `EmptyState`), candidate apply flow đã chạy.
- API jobs hiện hỗ trợ query: `page`, `limit`, `search`, `status` (chưa có location/employmentType/salary filter ở backend).
- Kết luận: MVP nên triển khai theo 2 lớp:
- Lớp 1 (làm ngay): IA + UX + filter lõi dùng `search` backend + filter phụ client-side trên danh sách đã load.
- Lớp 2 (sau MVP): mở rộng API filter dần, giữ nguyên kiến trúc hiện tại.

## 1) Information Architecture (Homepage + Job List)

### 1.1 Homepage (`/`) - IA đề xuất

1. `Top Nav`:
- Logo, `Tìm việc`, `Đăng nhập`, `Tạo tài khoản`.
- Nếu đã login: thay CTA bằng `Vào dashboard` (đang có logic role redirect, giữ nguyên).

2. `Hero + Search intent`:
- H1 rõ nhu cầu: tìm việc nhanh, apply gọn.
- 1 ô tìm kiếm lớn (job title/keyword) + CTA `Tìm việc ngay` -> `/jobs?search=`.
- Quick links theo intent: `Remote`, `Fresher`, `Frontend`, `Backend`.

3. `Trust strip` (social proof mỏng, không phô trương):
- 3-4 số liệu tĩnh MVP: số jobs active, số công ty, tỉ lệ phản hồi (nếu chưa có số thật thì dùng copy an toàn: “Đang cập nhật mỗi ngày”).

4. `Featured jobs preview`:
- 6-8 job cards mới nhất (reuse card pattern ở `/jobs`).
- CTA phụ: `Xem tất cả việc làm`.

5. `How it works (3 bước)`:
- Tạo tài khoản -> Upload CV -> Apply.
- Mục tiêu: giảm mơ hồ flow cho user mới.

6. `Candidate CTA cuối trang`:
- 1 CTA chính duy nhất: `Tạo hồ sơ và ứng tuyển`.

### 1.2 Job listing (`/jobs`) - IA đề xuất

1. `Page header + result summary`:
- H1: “Việc làm đang tuyển”.
- Dòng phụ: tổng số kết quả + context query (vd: “120 việc làm cho ‘react’”).

2. `Search + Filter bar`:
- Ô search luôn visible.
- Desktop: filter chips/dropdowns ngang header.
- Mobile: nút `Bộ lọc` mở bottom sheet/drawer.

3. `Sort + view state`:
- MVP chỉ `Mới nhất` (default, map với `createdAt desc` backend).
- Có `Clear all` khi đang có filter.

4. `Results list`:
- Card ưu tiên thông tin quyết định: title, employmentType, location (nếu có), salary range (nếu có), ngày đăng tương đối.
- CTA chính duy nhất/card: `Xem chi tiết`.

5. `Pagination / Load more`:
- MVP: pagination đơn giản theo query `page`.
- Luôn giữ state filter/search trên URL.

6. `Empty / error state`:
- Empty theo query: đề xuất nới keyword + 2 quick chips để thử lại.
- Error: message rõ + retry.

## 2) Filter UX model (Desktop + Mobile) + Priority

### 2.1 Must-have (MVP ngay)

1. `Keyword search` (backend query `search` đã có):
- Debounce 300-500ms hoặc submit explicit bằng Enter/button.
- Đồng bộ URL: `/jobs?search=...`.

2. `Employment type` (FULL_TIME/PART_TIME/...) - client-side phase 1:
- Vì API chưa support filter này.
- Apply local trên `jobs.items` hiện có; khi mở rộng API thì giữ nguyên UI contract.

3. `Location mode` (Remote/Onsite/Hybrid) - client-side phase 1:
- Parse từ `job.location` nếu có; thiếu data thì fallback `Không công bố`.

4. `Reset filters` + `active filter chips`:
- User thấy rõ filter nào đang tác động.

5. `Sticky filter bar` desktop:
- Khi scroll list dài vẫn giữ search/filter truy cập nhanh.

### 2.2 Mobile behavior (must-have)

1. Nút `Bộ lọc` cố định ở header list.
2. Mở `bottom sheet` full-height 80-90%:
- Nhóm filter dạng accordion.
- Footer cố định: `Xóa` + `Áp dụng`.
3. Badge hiển thị số filter đang bật trên nút `Bộ lọc`.
4. Đóng sheet không làm mất draft thay đổi cho tới khi bấm `Áp dụng`.

### 2.3 Later (sau MVP)

1. Salary range (min/max).
2. Experience level.
3. Company/industry.
4. Multi-select skills với typeahead.
5. “Saved filters / alert jobs”.
6. Backend filtering thật cho employment/location/salary để scale >1000 jobs.

## 3) SEO + Content strategy (Next.js App Router)

### 3.1 Technical SEO cần làm ngay

1. Page metadata theo route:
- `app/page.tsx`: title/description chuyên biệt homepage.
- `app/jobs/page.tsx`: title/description theo intent tìm việc.

2. Tạo `app/sitemap.ts` + `app/robots.ts`:
- Index homepage, `/jobs`, job detail public.
- Chặn route nội bộ dashboard/auth khỏi crawl.

3. Canonical URL:
- `/jobs` canonical về URL sạch (hoặc canonical có query chuẩn nếu muốn index theo landing query chính).

4. Structured data (JSON-LD):
- Homepage: `WebSite`, `Organization`.
- Jobs listing: `ItemList`.
- Job detail (`/jobs/[slug]`): `JobPosting` (quan trọng nhất cho recruitment SEO).

### 3.2 Content SEO cần làm ngay

1. Homepage copy theo intent:
- “Tìm việc [ngành/chức danh]”, “việc làm mới nhất”, “ứng tuyển nhanh”.

2. Jobs listing content block ngắn dưới list:
- 120-180 từ FAQ mini: cách tìm việc, cách apply, update tần suất.
- Tránh trang listing chỉ có cards (mỏng nội dung).

3. Internal linking:
- Homepage -> jobs listing -> job detail.
- Jobs empty state/link quay về homepage hoặc category gợi ý.

### 3.3 Content/SEO later

1. Landing pages theo taxonomy (`/jobs/frontend`, `/jobs/remote`, `/jobs/ha-noi`).
2. FAQ schema cho câu hỏi ứng tuyển phổ biến.

## 4) Conversion funnel + metrics (candidate journey)

### 4.1 Funnel chuẩn cho MVP

1. `home_view`
2. `home_cta_click` (browse jobs/search submit)
3. `jobs_list_view`
4. `jobs_search_or_filter_applied`
5. `job_card_click` -> detail
6. `job_detail_view`
7. `apply_cta_click`
8. Gate events:
- `apply_gate_login_required`
- `apply_gate_wrong_role`
- `apply_gate_cv_required`
9. `apply_submit`
10. `apply_success` hoặc `apply_failed`

### 4.2 KPI tối thiểu

1. CTR Home -> Jobs list = `home_cta_click / home_view`.
2. Job detail open rate = `job_detail_view / jobs_list_view`.
3. Apply start rate = `apply_cta_click / job_detail_view`.
4. Apply completion rate = `apply_success / apply_submit`.
5. CV prerequisite drop-off = `apply_gate_cv_required / apply_cta_click`.
6. Login gate drop-off = `apply_gate_login_required / apply_cta_click`.

### 4.3 Guardrail metrics

1. Time to first meaningful result list (jobs page).
2. Zero-result rate sau filter/search.
3. Error rate ở apply submit.

## 5) Accessibility + Performance guardrails

### 5.1 Accessibility (must-have)

1. Full keyboard flow:
- Search -> filter controls -> result cards -> pagination/apply.

2. Focus visible rõ ràng:
- Không bỏ outline mặc định nếu chưa có custom equivalent.

3. Label/Name/Role đúng:
- Input search, select, checkbox, buttons.
- Filter drawer có `aria-labelledby`, trap focus, ESC close.

4. Live region cho kết quả:
- Khi apply filter/search, announce “X kết quả”.

5. Contrast AA:
- Text/body >= 4.5:1.

### 5.2 Performance (must-have)

1. Core Web Vitals budget:
- LCP <= 2.5s, INP <= 200ms, CLS <= 0.1.

2. Jobs list:
- SSR first paint (đã có), tránh client-heavy filter library.
- Trì hoãn component không critical (vd tooltip/chips mở rộng).

3. Payload budget:
- Card list chỉ render field cần quyết định click.
- Mô tả job truncate 2-3 dòng ở list.

4. Media/fonts:
- Không dùng hero image nặng ở homepage MVP.

## 6) Anti-patterns cần tránh (AI-slop / clutter)

1. Quá nhiều CTA ngang hàng trong hero (chỉ 1 primary, 1 secondary).
2. Card job nhồi badge/chips dày đặc làm mờ title.
3. Filter panel 10+ trường ngay MVP (gây paralysis).
4. Auto-carousel testimonial/logo chuyển động liên tục.
5. Copy chung chung kiểu “AI thông minh nhất” không chứng minh được.
6. Màu sắc decorative quá mạnh gây giảm scanability của list.
7. Không đồng bộ URL state của filter/search (back/forward bị hỏng).
8. Infinite scroll không có điểm dừng + không có trạng thái indexable SEO.

## Rollout gợi ý (thực dụng, bám repo)

1. Phase 1 (1-2 ngày):
- Nâng cấp IA homepage + jobs list UI skeleton + URL state search/filter.

2. Phase 2 (1 ngày):
- Metadata theo route + sitemap/robots + JSON-LD cơ bản.

3. Phase 3 (0.5-1 ngày):
- Event tracking tối thiểu cho funnel apply.

4. Phase 4 (0.5 ngày):
- A11y/perf audit checklist + fix nhanh.

## Confidence / Assumptions

- Confidence: 0.83 (cao vừa). Lý do: fit tốt với API/UI hiện có, không cần đổi kiến trúc.
- Assumptions:
- Ưu tiên MVP candidate journey hơn recruiter branding.
- Team chấp nhận filter phase 1 có phần client-side trước khi mở rộng API.
- Chưa yêu cầu tích hợp analytics vendor cụ thể (GA/PostHog); hiện chỉ cần event contract.

## Sources

- Next.js Metadata API: https://nextjs.org/docs/app/api-reference/functions/generate-metadata
- Next.js Robots/Sitemap: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots ; https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
- Next.js JSON-LD guidance: https://nextjs.org/docs/app/guides/json-ld
- Google Search Central - Job posting structured data: https://developers.google.com/search/docs/appearance/structured-data/job-posting
- Google Search Central - Pagination guidance: https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading
- web.dev Core Web Vitals thresholds: https://web.dev/articles/lcp ; https://web.dev/articles/inp ; https://web.dev/articles/cls
- W3C WCAG 2.2 Quick Reference: https://www.w3.org/WAI/WCAG22/quickref/
- TopCV (reference visual/content direction): https://www.topcv.vn/

## Unresolved questions

1. Có index trang `/jobs` theo từng query phổ biến (vd remote/frontend) ngay MVP hay chờ taxonomy pages riêng?
2. Event tracking sẽ gửi về đâu trong sprint này (log nội bộ, GA4, hay PostHog)?
3. Nguồn số liệu “trust strip” lấy từ DB thật hay placeholder copy trung tính?
