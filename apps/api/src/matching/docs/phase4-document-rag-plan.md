# Kế hoạch Triển khai Phase 4: Document RAG (Recommend Lọc Top N CV & Job)

## Mục tiêu
Trang bị khả năng "Semantic Search" (Tìm kiếm theo ngữ nghĩa) ở quy mô lớn cho hệ thống. Thay vì dùng SQL lọc cứng nhắc, hệ thống có thể quét 10.000 CV và gợi ý chính xác Top 50 CV phù hợp nhất cho một Công việc, hoặc ngược lại, dựa vào Vector Similarity.

## Quyết định Thiết kế (Đã được duyệt)

**1. Thay đổi luồng Insert/Update**
Bất cứ khi nào 1 Job được `CREATE` hoặc `UPDATE` (và tương tự với CV), chúng ta sẽ gọi API của Gemini để lấy Vector rồi cập nhật vào CSDL. Điều này sẽ được chạy ngầm (async background job/fire-and-forget) thay vì block request của người dùng để đảm bảo tốc độ tạo CV/Job không bị ảnh hưởng.

**2. Dữ liệu mang đi Embed (nhúng)**
Dựa vào giới hạn token của `text-embedding-004` (max 2048 token), ta gom các trường đậm đặc nhất để tạo Vector:
- **Với Job:** `Title` + `Description (cắt ngắn 1000 ký tự)` + `Skills array`.
- **Với CV:** `Title/Role` + `Summary` + `Skills array`. 

## Các thay đổi Kỹ thuật

### Database Layer (Prisma)

Sửa đổi Schema để hỗ trợ Vector cho Entity:
- Thêm cột `embedding Unsupported("vector(768)")?` vào bảng **`CV`**.
- Thêm cột `embedding Unsupported("vector(768)")?` vào bảng **`Job`**.
- Thêm index HNSW `@@index([embedding(ops: vector_cosine_ops)], type: Hnsw)` cho cả 2 bảng.

### Core Backend (API)

- Dịch vụ chuyên chịu trách nhiệm Đồng bộ Vector: 
  - Đọc dữ liệu của CV/Job, ghép chuỗi (stringify).
  - Gọi `geminiClient.generateEmbedding()`.
  - Execute SQL để update cột `embedding` trong CSDL.

- Dịch vụ chuyên chịu trách nhiệm Tìm kiếm Semantic:
  - Cung cấp hàm `findTopCvsForJob(jobId, limit = 50)`: Lấy vector của Job, chạy SQL Cosine Distance qua bảng `CV` để lôi ra top 50 id.
  - Cung cấp hàm `findTopJobsForCv(cvId, limit = 50)`: Ngược lại.

### Integration (Gắn vào luồng chính)

- Sửa các API lưu CV / Job để trigger ngầm tiến trình tạo Vector sau khi dữ liệu lưu xong.
