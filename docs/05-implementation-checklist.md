# Implementation Checklist

Timeline: **1-2 tuần** (14 ngày)

## Week 1: Foundation (Ngày 1-7)

### Ngày 1-2: Project Setup

- [ ] Tạo monorepo structure với pnpm workspaces
- [ ] Init Next.js 15 app (App Router)
- [ ] Init NestJS app
- [ ] Setup PostgreSQL (local hoặc Railway)
- [ ] Init Prisma
- [ ] Configure environment variables
- [ ] Test frontend-backend connection

### Ngày 3-4: Authentication & Database

- [ ] Tạo Prisma schema (6 models)
- [ ] Run migration
- [ ] Tạo seed data
- [x] Setup NextAuth.js v5
- [x] Implement register/login API
- [x] Implement JWT strategy
- [x] Create login/register pages
- [x] Test authentication flow

### Ngày 5: User Management

- [x] Create users CRUD API (Admin)
- [x] Create profile API
- [x] Create user list page (Admin)
- [x] Create profile page
- [x] Test RBAC (Admin, Recruiter, Candidate)

### Ngày 6-7: CV Management

- [x] Install pdf-parse, mammoth
- [x] Implement file upload API
- [x] Implement text extraction
- [x] Setup Gemini API client
- [x] Implement CV parsing service
- [x] Create CV upload page
- [x] Create CV list page
- [x] Test CV upload + parsing

## Week 2: Core Features (Ngày 8-14)

### Ngày 8-9: Job Management

- [x] Create jobs CRUD API
- [x] Implement job status transitions
- [x] Create job form (với rich editor)
- [x] Create job list page
- [x] Create job detail page
- [x] Test job posting flow

### Ngày 10-11: Matching Algorithm

- [x] Install natural.js (TF-IDF)
- [x] Implement TF-IDF calculation
- [x] Implement skills matching
- [x] Implement final score calculation
- [x] Create matching service
- [x] Test matching với sample data
- [x] Optimize performance

### Ngày 12: Application Flow

- [x] Create applications API
- [x] Implement apply endpoint (với matching)
- [x] Implement status update API
- [x] Create apply button/modal
- [x] Create applications list (Candidate)
- [x] Create applications list (Recruiter)
- [x] Test application flow

### Ngày 13: Dashboard & UI

- [x] Create dashboard stats API
- [x] Create candidate dashboard
- [x] Create recruiter dashboard
- [x] Create admin dashboard
- [x] Polish UI/UX
- [x] Add loading states
- [x] Add error handling
- [x] Responsive design

### Ngày 14: Testing & Polish

- [ ] Test toàn bộ flows
- [ ] Fix bugs
- [ ] Add demo data
- [ ] Write README
- [ ] Prepare demo script
- [ ] Test demo scenario

## Bonus (Nếu Còn Thời Gian)

### Semantic Matching

- [ ] Setup Gemini embeddings
- [ ] Implement semantic score
- [ ] Update final score formula
- [ ] Test accuracy improvement

### UI Enhancements

- [ ] Dark mode
- [ ] Toast notifications
- [ ] Better error messages
- [ ] Animations

### Features

- [ ] Search & filters
- [ ] Pagination
- [ ] Sort options
- [ ] Export CV/applications

## Testing Checklist

### Authentication

- [x] Register với email/password
- [x] Login thành công
- [x] Logout
- [x] Protected routes redirect
- [x] Role-based access

### CV Flow

- [ ] Upload PDF CV
- [ ] Upload DOCX CV
- [ ] Parse thành công
- [ ] Edit parsed data
- [ ] Set primary CV
- [ ] Delete CV

### Job Flow

- [ ] Create job (draft)
- [ ] Edit job
- [ ] Publish job
- [ ] Close job
- [ ] Delete job
- [ ] View job list

### Matching & Application

- [x] Apply vào job
- [x] Match score hiển thị đúng
- [x] Skills breakdown đúng
- [ ] Ranking candidates
- [x] Update application status
- [x] View application history

### Dashboard

- [x] Candidate dashboard stats đúng
- [x] Recruiter dashboard stats đúng
- [x] Admin dashboard stats đúng

## Demo Scenario

### Scenario 1: Candidate Journey

1. Đăng ký account (Candidate)
2. Upload CV (PDF)
3. Review parsed data
4. Browse jobs
5. Apply vào 2-3 jobs
6. View application status

### Scenario 2: Recruiter Journey

1. Đăng ký account (Recruiter)
2. Create job posting
3. Publish job
4. View applications
5. Review candidates với match scores
6. Update application status

### Scenario 3: Admin

1. Login as Admin
2. View all users
3. View all jobs
4. View all applications
5. Manage system

## Success Criteria

- [ ] Tất cả core features hoạt động
- [ ] Matching algorithm cho kết quả hợp lý
- [ ] UI responsive và user-friendly
- [ ] Không có critical bugs
- [ ] Demo flow mượt mà
- [ ] Code clean và có comments
