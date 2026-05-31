# Báo cáo thực hiện nhiệm vụ RAG Phase 1 (Agent 2)

**Vai trò:** Agent 2 - Integration + Eval Guardrails  
**Trạng thái:** Hoàn thành các hạng mục cấu trúc và Prompt Guardrails.

Dưới đây là chi tiết các hạng mục đã thực hiện theo kế hoạch `rag-implementation-phases.md`:

### Task 2.1 & 2.2: Define Integration Contract & Prompt Guardrails cho RAG (Hoàn thành)
- **File đã sửa:** `apps/api/src/normalization/ai-normalization.service.ts`
- **Nội dung thực hiện:** 
  - Đã cập nhật hàm `evaluateCvAgainstJd` để nhận tham số tùy chọn `ragContext?: string`. Điều này cho phép hệ thống gọi hàm mà không có RAG Context (đảm bảo backwards-compatibility) hoặc có RAG Context khi Agent 1 hoàn thiện hàm Retriever.
  - Đã sửa đổi `buildJdEvalPrompt` để nhúng `ragContext` vào prompt (nếu có).
  - Đã thêm các Guardrails (Luật Bảo vệ) cực kỳ nghiêm ngặt vào Prompt:
    1. Yêu cầu LLM coi RAG Context chỉ là thông tin tham khảo.
    2. Cấm LLM đánh giá Requirement là "met" chỉ dựa vào RAG Context, bắt buộc Evidence phải được trích xuất từ CV thô của ứng viên.
    3. RAG Context chỉ dùng để phiên dịch Alias (từ đồng nghĩa) hoặc công nghệ liên quan.

### Task 2.3: Mở rộng Mini Eval Plan (Hoàn thành)
- **File đã sửa:** `apps/api/src/matching/docs/mini-eval-plan.md`
- **Nội dung thực hiện:** Đã thêm **Nhóm 5: RAG Specific Cases** vào bộ test để đánh giá RAG:
  - Kiểm tra Skill Alias (vd: `ReactJS` = `React`).
  - Kiểm tra Related Skill (vd: `NestJS` liên quan tới `Node.js`).
  - Kiểm tra Rủi ro False Positive (vd: Kinh nghiệm dùng AWS không có nghĩa là có chứng chỉ AWS).
  - Kiểm tra Keyword Stuffing Guardrail: Xác nhận LLM không bị đánh lừa bởi RAG khi ứng viên spam từ khóa.

### Task 2.4: Integration Tests với Mock Retriever (Đang chờ Agent 1)
- **Trạng thái:** Pending.
- **Lý do:** Tôi đã mở cổng tham số `ragContext` trong `ai-normalization.service.ts`. Tuy nhiên, để viết Integration Test hoàn chỉnh, tôi cần Agent 1 public các Interface của RAG Service (vd: `RetrievalService` hoặc RAG DTOs). Ngay khi Agent 1 merge code, test này sẽ được viết ngay trong hàm `matching.service.spec.ts`.

---
**Next Steps:**
- Chờ Agent 1 hoàn thành `Task 1.1` đến `Task 1.4` (Xây dựng Types và In-memory Retriever).
- Tích hợp `RetrieverService` của Agent 1 vào `MatchingService` để lấy `ragContext` và truyền vào `AiNormalizationService`.
- Chạy toàn bộ Unit/Integration Test!
