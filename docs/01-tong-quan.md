# Tổng Quan Hệ Thống

## Mục Tiêu

Xây dựng platform tuyển dụng với AI matching tự động giữa CV ứng viên và Job Description của nhà tuyển dụng.

## Phạm Vi MVP (1-2 Tuần)

### Core Features

- Authentication với 3 roles
- CV management + AI parsing
- Job posting management
- Matching algorithm (TF-IDF + skills)
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
4. Gemini API parse thông tin:
   - Skills
   - Experience
   - Education
   - Contact info
5. Lưu vào database
6. Candidate review và edit nếu cần
```

### Luồng 2: Recruiter Post Job

```
1. Recruiter đăng nhập
2. Tạo job posting:
   - Title, description
   - Required skills (chọn từ dropdown)
   - Salary, location, type
3. Lưu vào database
4. Publish job
```

### Luồng 3: Matching & Application

```
1. Candidate tìm job
2. Click "Apply"
3. System tính match score:
   - TF-IDF: so sánh full text CV vs JD (70%)
   - Skills overlap: đếm skills match (30%)
   - Final score: 0-100%
4. Lưu application với score
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
       ├─→ Gemini API (CV parsing, matching)
       └─→ Local filesystem (CV files)
```

## Scalability Plan

Thiết kế cho phép mở rộng sau:

- Skills: JSONB → normalized tables
- Storage: Local → Cloudflare R2
- Matching: TF-IDF → Semantic embeddings
- Features: Email notifications, analytics, team management
