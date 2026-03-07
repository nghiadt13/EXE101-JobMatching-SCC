# Tổng Quan Hệ Thống

## Mục Tiêu

Xây dựng platform tuyển dụng với AI matching tự động giữa CV ứng viên và Job Description của nhà tuyển dụng.

## Phạm Vi MVP (1-2 Tuần)

### Core Features

- Authentication với 3 roles
- CV management + AI parsing
- Job posting management
- Matching algorithm theo schema yêu cầu + đánh giá deterministic
- Application flow
- Dashboard đơn giản

### Không Có Trong MVP

- ❌ Email notifications
- ❌ Email verification
- ❌ Company team management
- ❌ Advanced analytics
- ❌ Deployment (chỉ localhost)

## User Roles

### 1. Admin

- Quản lý toàn bộ hệ thống
- CRUD users
- Xem tất cả data

### 2. Recruiter/HR

- Đăng job postings
- Xem applications
- Review candidates với match scores
- Chỉ xem data của mình

### 3. Candidate

- Upload/tạo CV
- Tìm kiếm jobs
- Apply vào jobs
- Track application status
- Chỉ xem data của mình

## Luồng Chính

### Luồng 1: Candidate Upload CV

```
1. Candidate đăng ký/đăng nhập
2. Upload CV (PDF/DOCX)
3. Backend extract text
4. Gửi text vào configured LLM provider (Gemini or OpenAI) để parse:
   - Skills (với canonical representation)
   - Experience
   - Education
   - Contact info
5. Lưu vào database với skillAtoms cho matching
6. Candidate review và edit nếu cần
7. Nếu AI parse thất bại, API trả về 422 (parse error) để user retry
8. Nếu AI service unavailable, API trả về 503 để user thử lại sau
```

### Luồng 2: Recruiter Post Job

```
1. Recruiter đăng nhập
2. Tạo job posting:
   - Title, description
   - Required skills (manual hoặc AI extract từ JD text)
   - Salary, location, type
3. Gửi JD text vào configured LLM provider để normalize về schema chuẩn
4. Lưu vào database với skillAtoms cho matching
5. Publish job
6. Nếu AI parse thất bại, API trả về 422 để user retry
7. Nếu AI service unavailable, API trả về 503 để user thử lại sau
```

### Luồng 3: Matching & Application

```
1. Candidate tìm job
2. Click "Apply"
3. System tính match score:
   - Dựng `candidateProfile` từ CV
   - Dựng `requirementsSchema` từ JD
   - Đánh giá từng requirement: met / partial / missing
   - Final score: 0-100%
4. Lưu application với `matchScore` + `matchingSnapshot`
5. Recruiter xem applications, sort by score
```

## Kiến Trúc Tổng Quan

```
┌─────────────┐
│  Next.js    │ ← Frontend (port 3000)
│  (Web App)  │
└──────┬──────┘
       │ HTTP/REST
       ↓
┌─────────────┐
│   NestJS    │ ← Backend API (port 3001)
│  (API)      │
└──────┬──────┘
       │
       ├─→ PostgreSQL (Database)
       ├─→ LLM Provider (Gemini or OpenAI - CV/JD parsing normalization)
       └─→ Local filesystem (CV files)
```

LLM provider được chọn qua `LLM_PROVIDER` env var (gemini hoặc openai, default gemini).

## Scalability Plan

Thiết kế cho phép mở rộng sau:

- Skills: JSONB → normalized tables
- Storage: Local → Cloudflare R2
- Matching: deterministic schema evaluation → richer ranking / semantic assist nếu cần
- Features: Email notifications, analytics, team management
