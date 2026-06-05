# Tổng quan Kiến trúc và Tiến độ Triển khai RAG cho AI Matching

Tài liệu này tổng hợp mục đích, kiến trúc cốt lõi và tiến độ thực tế của việc tích hợp RAG (Retrieval-Augmented Generation) vào hệ thống Job Matching.

## 1. Tác dụng của RAG trong Dự án

Sự kết hợp hoàn hảo được chia làm 2 vai trò rõ rệt:

- **Knowledge RAG (Trợ lý Tra cứu):** Không thực hiện phân tích hay chấm điểm. Nhiệm vụ là "đánh hơi" từ khóa công nghệ trong CV và JD, truy xuất định nghĩa, mối liên hệ tương ứng.
- **LLM (Giám khảo Phân tích):** Nhận nguyên văn CV, JD và **Tài liệu tham khảo do RAG cung cấp** để chấm điểm chi tiết (1-on-1 Matching).

### ❓ Tại sao LLM thông minh mà vẫn cần RAG?

1. **Kiểm soát luật chơi (Domain Rules):** Buộc LLM tuân theo luật công ty thay vì kiến thức chung của Internet.
2. **Thuật ngữ nội bộ (Proprietary Keywords):** Giải thích các từ khóa nội bộ (VD: Core-SSC).
3. **Khả năng giải trình (Auditability):** Mọi điểm số do AI chấm đều có "Source" luật rõ ràng.

---

## 2. Quá trình Nâng cấp RAG (Evolution)

### 🌟 Phase 1 & 2: Fast-Track In-Memory Knowledge RAG (Hoàn thành)

- Lưu cứng dữ liệu vào mảng tĩnh. Khớp Lexical chạy trên RAM. Tốc độ siêu nhanh.

### 🚀 Phase 3: Database-Backed Hybrid Knowledge RAG (Hoàn thành)

- Lưu dữ liệu vào Postgres. Áp dụng Hybrid Search (Vector 768 chiều + FTS). Dùng RRF mix điểm.

### 🔥 Phase 4 (Đang lên kế hoạch): Document/Candidate RAG (Semantic Search)

- **Mục tiêu:** Quét hàng ngàn CV trong tích tắc để lọc ra Top N CV phù hợp nhất cho một Job (hoặc Top N Job cho một CV). Đóng vai trò là "Tấm lưới lọc khổng lồ" trước khi đưa vào "Mũi khoan tinh xảo" LLM, tiết kiệm token và đảm bảo context windows trong phạm vi giới hạn.
- **Cách làm:** Nhúng (Embed) toàn bộ nội dung lõi của CV và Job thành Vector. Dùng Postgres `pgvector` tính Cosine Distance để Recommend thay cho SQL cứng nhắc.

---

## 3. Trạng thái Công việc (Tiến độ)

### ✅ Những việc ĐÃ LÀM (Done)

- Nâng cấp `schema.prisma` cho Phase 3. Bổ sung `generateEmbedding` vào `GeminiClientService`.
- Tái cấu trúc Retriever dùng `$queryRaw` với Hybrid Search RRF.
- Cập nhật 118/118 Unit Tests Pass.

### ⏳ Những việc CHƯA LÀM (To-Do / Next Steps cho KTPM)

1. Cấu hình file `.env`, chạy `npx prisma db push`.
2. Chạy file seed nạp DB: `npx ts-node apps/api/src/matching/rag/rag-seed.script.ts`.
3. Bắt đầu triển khai code cho Phase 4 (Xem Kế hoạch Triển khai).
