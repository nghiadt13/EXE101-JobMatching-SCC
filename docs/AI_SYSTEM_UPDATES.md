# Tài Liệu Cập Nhật Hệ Thống AI Matching (Smart Job Match & RAG Pipeline)

Tài liệu này tổng hợp toàn bộ các thay đổi và cải tiến đã được thực hiện đối với hệ thống AI Matching của dự án, giúp Đội ngũ kỹ sư phần mềm (SE) nhanh chóng nắm bắt kiến trúc mới, các lỗi đã được sửa, và cách vận hành/kiểm thử hệ thống.

---

## 📌 Tổng Quan Thay Đổi Kiến Trúc

Hệ thống cũ thực hiện việc gợi ý việc làm bằng cách tải toàn bộ danh sách công việc vào RAM, áp dụng chỉ số Jaccard cổ điển rồi gọi LLM đánh giá tuần tự từng việc. Luồng này mất từ **30 - 60 giây**, gây tốn kém chi phí API LLM cực lớn và không thể mở rộng (scale).

Kiến trúc mới áp dụng quy trình **Retrieve & Rerank** chuẩn công nghiệp:
1. **Retrieve (Lọc thô - Vector Search):** Sử dụng `pgvector` trên PostgreSQL kết hợp với mô hình nhúng `gemini-embedding-2` để thực hiện tìm kiếm ngữ nghĩa (Cosine Similarity). Trả về Top 10 kết quả phù hợp nhất trong **~1 giây** mà **không tốn bất kỳ lượt gọi LLM nào** khi xem danh sách gợi ý.
2. **Rerank (Đánh giá sâu - RAG + LLM):** Khi ứng viên nhấn ứng tuyển (apply), hệ thống thực hiện phân tích chi tiết (1-on-1 Matching). Quá trình này truy vấn tri thức nghiệp vụ nội bộ thông qua **Hybrid Search RAG** (kết hợp Vector Search và Full-Text Search trong Postgres) để cung cấp ngữ cảnh cố vấn (advisory context) giúp LLM đưa ra nhận xét chính xác, giải trình rõ ràng và mượt mà hơn.

```mermaid
flowchart TD
    subgraph Phase 1: Gợi ý Việc làm (Smart Job Match)
        A[Ứng viên yêu cầu quét việc làm] --> B[VectorSyncService: Đồng bộ hóa Vector CV]
        B --> C[SemanticSearchService: Truy vấn pgvector <=> trên PostgreSQL]
        C -->|Top 10 Jobs| D[Trả kết quả ngay lập tức ~1s / 0 LLM calls]
    end

    subgraph Phase 2: Đánh giá Ứng tuyển (Rerank & RAG)
        E[Ứng tuyển Job cụ thể] --> F[Lấy thông tin CV & JD]
        F --> G[RagRetrieverService: Hybrid Search RRF trên DB]
        G -->|Advisory Rules| H[AiNormalizationService: Gọi LLM đánh giá]
        H --> I[Grounding Validator: Kiểm tra bằng chứng thực tế từ CV]
        I --> J[Trả kết quả Matching chi tiết]
    end
```

---

## 🛠️ Chi Tiết Các Thay Đổi & Nâng Cấp

### 1. Khắc phục Lỗi Nghiệp Vụ Nghiêm Trọng (Core Bug Fixes)
*   **Lỗi Validation "cvId must be a UUID":**
    *   **Tệp chỉnh sửa:**
        *   [start-recommendation.dto.ts](file:///f:/Work_Space/Project/SCC/EXE101-JobMatching-SCC/apps/api/src/matching/dto/start-recommendation.dto.ts): Chuyển `@IsUUID()` thành `@IsString() + @IsNotEmpty()`.
        *   [recommendation.controller.ts](file:///f:/Work_Space/Project/SCC/EXE101-JobMatching-SCC/apps/api/src/matching/recommendation.controller.ts): Loại bỏ `ParseUUIDPipe` trên `scanId` tham số.
    *   **Nguyên nhân:** Database sử dụng hàm `cuid()` của Prisma cho các khóa chính (chuỗi 25 ký tự bắt đầu bằng `cl...`), không phải dạng UUID tiêu chuẩn. Lớp Validation DTO trước đó cấu hình nhầm thành UUID dẫn đến việc chặn các request hợp lệ từ Client.
*   **Lỗi Template Literal của Vector String:**
    *   **Tệp chỉnh sửa:** [vector-sync.service.ts](file:///f:/Work_Space/Project/SCC/EXE101-JobMatching-SCC/apps/api/src/matching/rag/vector-sync.service.ts)
    *   **Chi tiết:** Các biểu thức chuỗi SQL raw trước đó chứa ký tự escape `\${}` làm cho chuỗi mảng vector bị gửi dưới dạng chữ thuần túy thay vì giá trị số thực của embedding. Đã được sửa lại bằng nối chuỗi tường minh: `'[' + embedding.join(',') + ']'`.

### 2. Thiết lập Vector Database & pgvector
*   **Tệp chỉnh sửa:**
    *   [schema.prisma](file:///f:/Work_Space/Project/SCC/EXE101-JobMatching-SCC/apps/api/prisma/schema.prisma): Thêm trường `embedding Unsupported("vector(768)")?` cho bảng `CV` và `Job`.
    *   [init-pgvector.js](file:///f:/Work_Space/Project/SCC/EXE101-JobMatching-SCC/apps/api/init-pgvector.js): Script độc lập sử dụng Driver `pg` để tự động tạo Extension `vector` trong PostgreSQL (`CREATE EXTENSION IF NOT EXISTS vector;`).

### 3. Hệ Thống Tri Thức Nghiệp Vụ `RagKnowledge` (Đặc biệt quan trọng)
Để giải quyết bài toán LLM không hiểu sâu các quy tắc nghiệp vụ nội bộ và các từ đồng nghĩa/viết tắt công nghệ, chúng tôi đã xây dựng hệ thống quản lý tri thức động lưu trữ trong DB:
*   **Cấu trúc bảng dữ liệu `RagKnowledge` trong [schema.prisma](file:///f:/Work_Space/Project/SCC/EXE101-JobMatching-SCC/apps/api/prisma/schema.prisma):**
    *   `id`: Chuỗi định danh CUID tự sinh (`@default(cuid())`).
    *   `kind`: Loại tri thức giúp tối ưu hóa lọc và phân tách logic nghiệp vụ:
        *   `skill_alias`: Các từ viết tắt, từ đồng nghĩa hoặc các cách viết khác nhau (ví dụ: `React` $\leftrightarrow$ `ReactJS` $\leftrightarrow$ `react.js`).
        *   `related_skill`: Các công nghệ bổ trợ đi liền với nhau trong hệ sinh thái (ví dụ: `NextJS` bổ trợ cho `React`, `NestJS` chạy trên `Node.js`).
        *   `skill_group`: Phân nhóm chuyên môn lớn (Frontend, Backend, Cloud Infrastructure, AI/ML, Mobile).
        *   `role_expectation`: Các yêu cầu kỹ năng mặc định theo vai trò và cấp bậc (Intern, Junior, Senior, Tech Lead).
        *   `domain_hint`: Các thông tin nghiệp vụ/ràng buộc đặc thù (chứng chỉ AWS/Azure, ngoại ngữ tiếng Nhật/Anh, các lĩnh vực như fintech, y tế).
    *   `title`: Tên từ khóa hoặc quy tắc chính.
    *   `content`: Định nghĩa hoặc hướng dẫn chi tiết mà LLM sẽ dùng để tham chiếu khi đánh giá hồ sơ.
    *   `source`: Nguồn gốc sinh dữ liệu (ví dụ: `seed:skill-aliases`, `seed:role-expectations`).
    *   `tags`: Mảng các chuỗi (`String[]`) từ khóa phụ phục vụ việc khớp từ khóa thô (Keyword Search).
    *   `embedding`: Vector nhúng 768 chiều kiểu `Unsupported("vector(768)")?` cho phép tìm kiếm tương đồng ngữ nghĩa.
*   **Quá trình Seed tri thức:**
    *   Tập tin hạt nhân [rag-knowledge.seed.ts](file:///f:/Work_Space/Project/SCC/EXE101-JobMatching-SCC/apps/api/src/matching/rag/rag-knowledge.seed.ts) chứa hơn 50 bộ tri thức mẫu chuẩn hóa.
    *   Script nạp DB [rag-seed.script.ts](file:///f:/Work_Space/Project/SCC/EXE101-JobMatching-SCC/apps/api/src/matching/rag/rag-seed.script.ts) sẽ: gọi Gemini API sinh Vector nhúng cho từng dòng tri thức dựa trên chuỗi tổng hợp `Title + Content + Tags`, sau đó chèn trực tiếp dòng dữ liệu kèm Vector vào Postgres.

### 4. Dịch vụ Semantic Search & Đồng bộ Vector
*   **Dịch vụ Mới:**
    *   [gemini-client.service.ts](file:///f:/Work_Space/Project/SCC/EXE101-JobMatching-SCC/apps/api/src/normalization/gemini-client.service.ts): Tích hợp API Gemini để sinh văn bản (`generateText`) và sinh Vector nhúng 768 chiều (`generateEmbedding` sử dụng model `gemini-embedding-2`).
    *   [semantic-search.service.ts](file:///f:/Work_Space/Project/SCC/EXE101-JobMatching-SCC/apps/api/src/matching/rag/semantic-search.service.ts): Triển khai tìm kiếm Cosine Similarity bằng toán tử `<=>` của pgvector:
        ```sql
        SELECT id, 1 - (embedding <=> $1::vector) AS score
        FROM "Job"
        WHERE embedding IS NOT NULL AND status = 'PUBLISHED'
        ORDER BY embedding <=> $1::vector LIMIT $2
        ```
    *   [vector-sync.service.ts](file:///f:/Work_Space/Project/SCC/EXE101-JobMatching-SCC/apps/api/src/matching/rag/vector-sync.service.ts): Quản lý luồng sinh embedding tự động cho CV và Job dựa trên các thông tin cốt lõi (Title, Description, Skills).

### 5. Thuật toán Hybrid Search RAG với RRF
*   **Tệp triển khai:** [rag-retriever.service.ts](file:///f:/Work_Space/Project/SCC/EXE101-JobMatching-SCC/apps/api/src/matching/rag/rag-retriever.service.ts)
*   **Cơ chế hoạt động:** Khi phân tích CV ứng tuyển với JD, hệ thống gom toàn bộ kỹ năng và nội dung văn bản để thực hiện **Hybrid Search** trên bảng `RagKnowledge`.
*   **Thuật toán kết hợp (Reciprocal Rank Fusion - RRF):** Hệ thống thực hiện song song 2 luồng tìm kiếm và trộn điểm theo công thức:
    $$\text{RRF Score} = \frac{1.0}{60 + \text{Vector Rank}} + \frac{1.0}{60 + \text{Text Rank}}$$
    *   *Luồng 1 (Vector Search):* Tìm kiếm ngữ nghĩa bằng toán tử `<=>` dựa trên Vector nhúng của câu truy vấn.
    *   *Luồng 2 (Keyword Search):* Khớp từ khóa bằng Full-Text Search của Postgres sử dụng `ts_rank_cd` và `websearch_to_tsquery`.
    *   Các quy tắc tri thức tốt nhất vượt qua màng lọc RRF sẽ được định dạng ngắn gọn và đưa vào Prompt LLM dưới dạng `ragContext`.

### 6. Tối Ưu Prompt Đánh Giá & Bộ Kiểm Soát Hallucination
*   **Cải tiến Prompt:**
    *   **Tệp chỉnh sửa:** [ai-normalization.service.ts](file:///f:/Work_Space/Project/SCC/EXE101-JobMatching-SCC/apps/api/src/normalization/ai-normalization.service.ts) (hàm `buildJdEvalPrompt`)
    *   **Thay đổi:** LLM được cấu hình đóng vai trò "Senior HR Consultant". Toàn bộ văn phong nhận xét điểm mạnh/yếu được yêu cầu viết bằng **Tiếng Việt chuyên nghiệp, trôi chảy**, đi sâu vào phân tích dự án thực tế của ứng viên thay vì trích xuất thô sơ.
*   **Bộ Kiểm Chứng Bằng Chứng (Grounding Validator):**
    *   Để ngăn chặn việc LLM tự bịa đặt (hallucinate) kinh nghiệm không có trong CV, hệ thống bổ sung bộ kiểm tra chéo `isEvidenceSupportedByCv`.
    *   Hệ thống sẽ chuẩn hóa từ khóa và so khớp mã thông báo (tokens) của bằng chứng (Evidence) mà LLM trả về với nội dung gốc của CV. Nếu phát hiện bằng chứng không có thực trong CV, mức độ tin cậy (`confidence`) của tiêu chí đó sẽ tự động bị hạ xuống `"low"`.

### 7. Cải Tiến Giao Diện Người Dùng & Trải Nghiệm (UI/UX)
*   **Bỏ hiển thị % điểm số mơ hồ tại mục Gợi ý Việc làm:**
    *   **Tệp chỉnh sửa:** [scan-results-section.tsx](file:///f:/Work_Space/Project/SCC/EXE101-JobMatching-SCC/apps/web/app/dashboard/candidate/recommendations/scan-results-section.tsx) & [recommendation-client.ts](file:///f:/Work_Space/Project/SCC/EXE101-JobMatching-SCC/apps/web/lib/recommendation-client.ts)
    *   **Giải pháp:** Ẩn con số % thô (do điểm Vector Cosine Similarity chỉ mang tính ước lượng thô, dễ lệch với điểm LLM phân tích sâu sau này). Thay thế bằng nhãn phân nhóm độ phù hợp đã được Việt hóa (Ví dụ: `🟢 Rất phù hợp`, `🟡 Khá phù hợp`) kèm dòng chú thích: *"Ước lượng sơ bộ — ứng tuyển để xem phân tích chi tiết từ AI"*.
*   **Tự Động Polling (Real-time update) Trạng Thái Ứng Tuyển:**
    *   **Tệp chỉnh sửa:** [candidate-applications-table.tsx](file:///f:/Work_Space/Project/SCC/EXE101-JobMatching-SCC/apps/web/components/applications/candidate-applications-table.tsx)
    *   **Giải pháp:** Tích hợp `useEffect` kiểm tra nếu có bất kỳ hồ sơ ứng tuyển nào đang trong trạng thái xử lý AI (`PENDING_MATCHING`), client sẽ tự động gửi lệnh `router.refresh()` định kỳ mỗi **5 giây** để cập nhật kết quả mà người dùng không cần phải tải lại trang thủ công.
*   **Hiển Thị Đầy Đủ Nhận Xét (Không Cắt Ngắn):**
    *   **Tệp chỉnh sửa:** [matching-snapshot-v2.tsx](file:///f:/Work_Space/Project/SCC/EXE101-JobMatching-SCC/apps/web/components/applications/matching-snapshot-v2.tsx)
    *   **Giải pháp:** Loại bỏ các đoạn mã cắt ngắn chuỗi `.slice(0, 150) + '…'` gây mất mát thông tin. Chuyển đổi hiển thị bằng chứng CV từ dạng chuỗi ghép bởi dấu chấm trung tâm (` · `) sang dạng danh sách các điểm đầu dòng (`ul > li`) rõ ràng.

---

## 🚀 Hướng Dẫn Vận Hành & Thiết Lập Cho SE

Để chạy hệ thống AI mới trên môi trường phát triển (Local), SE cần thực hiện theo các bước sau:

### Bước 1: Khai báo cấu hình biến môi trường
Thêm các khóa cấu hình sau vào tệp `apps/api/.env`:
```env
# API Key của Gemini dùng cho việc sinh embedding và đánh giá
GEMINI_API_KEY="AIzaSy..."
# Tùy chọn model Gemini (Mặc định: gemini-3.1-flash-lite-preview)
GEMINI_MODEL="gemini-3.5-flash"
```

### Bước 2: Kích hoạt pgvector trên PostgreSQL
Hệ thống sử dụng Docker hoặc PostgreSQL cài đặt cục bộ. Chạy script để bật extension `vector`:
```bash
node apps/api/init-pgvector.js
```

### Bước 3: Cập nhật Schema Database
Đẩy các thay đổi schema (như kiểu dữ liệu `Unsupported("vector(768)")` và bảng `RagKnowledge`) lên cơ sở dữ liệu:
```bash
npx prisma db push
```

### Bước 4: Seed dữ liệu RAG Knowledge Base
Nạp toàn bộ quy tắc tri thức nghiệp vụ và tạo vector nhúng tương ứng trong database:
```bash
npx ts-node apps/api/src/matching/rag/rag-seed.script.ts
```

### Bước 5: Đồng bộ hóa Vector cho dữ liệu cũ (Backfill)
Nếu trong database đã có dữ liệu CV và Job cũ chưa có vector nhúng, hãy chạy script sau để đồng bộ hóa bổ sung:
```bash
npx ts-node apps/api/prisma/sync-vectors.ts
```

### Bước 6: Chạy kiểm thử hệ thống (Unit Tests)
Đảm bảo toàn bộ 118 unit tests liên quan đến Matching Pipeline và RAG chạy thành công:
```bash
# Chạy toàn bộ test suite của api
npm run test -w api -- --runInBand

# Hoặc chạy tập trung kiểm thử các dịch vụ cốt lõi
npm run test -w api -- matching.service.spec.ts --runInBand
npm run test -w api -- jd-driven-evaluation.service.spec.ts --runInBand
```

---

## 📊 So Sánh Hiệu Quả Trước & Sau Nâng Cấp

| Chỉ Số Đánh Giá | Hệ Thống Cũ (Legacy Jaccard) | Hệ Thống Mới (Vector Search + RAG) |
| :--- | :--- | :--- |
| **Thời gian quét Smart Job Match** | 30 - 60 giây | **~1 giây** |
| **Số lượt gọi API LLM khi gợi ý việc**| 20 lượt gọi / mỗi lần quét | **0 lượt gọi** (Hoàn toàn chạy trên DB) |
| **Tính chính xác trong nhận diện** | Chỉ khớp từ khóa chính xác (React ≠ ReactJS) | Hiểu được mối liên hệ ngữ nghĩa nhờ Vector & RAG |
| **Văn phong phân tích kết quả** | Tiếng Anh, khô khan, trích xuất thô sơ | **Tiếng Việt chuyên nghiệp, trôi chảy, sâu sắc** |
| **Độ tin cậy của bằng chứng (AI)** | Dễ bị Hallucination (LLM bịa thông tin) | **Được kiểm chứng chéo với văn bản gốc của CV** |
| **Trải nghiệm người dùng (UX)** | Phải reload thủ công để xem kết quả ứng tuyển | **Polling tự động cập nhật kết quả sau 5s** |
