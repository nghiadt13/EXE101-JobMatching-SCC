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

- [ ] Create users CRUD API (Admin)
- [ ] Create profile API
- [ ] Create user list page (Admin)
- [ ] Create profile page
- [ ] Test RBAC (Admin, Recruiter, Candidate)

### Ngày 6-7: CV Management

- [ ] Install pdf-parse, mammoth
- [ ] Implement file upload API
- [ ] Implement text extraction
- [ ] Setup Gemini API client
- [ ] Implement CV parsing service
- [ ] Create CV upload page
- [ ] Create CV list page
- [ ] Test CV upload + parsing

## Week 2: Core Features (Ngày 8-14)

### Ngày 8-9: Job Management

- [ ] Create jobs CRUD API
- [ ] Implement job status transitions
- [ ] Create job form (với rich editor)
- [ ] Create job list page
- [ ] Create job detail page
- [ ] Test job posting flow

### Ngày 10-11: Matching Algorithm

- [ ] Install natural.js (TF-IDF)
- [ ] Implement TF-IDF calculation
- [ ] Implement skills matching
- [ ] Implement final score calculation
- [ ] Create matching service
- [ ] Test matching với sample data
- [ ] Optimize performance

### Ngày 12: Application Flow

- [ ] Create applications API
- [ ] Implement apply endpoint (với matching)
- [ ] Implement status update API
- [ ] Create apply button/modal
- [ ] Create applications list (Candidate)
- [ ] Create applications list (Recruiter)
- [ ] Test application flow

### Ngày 13: Dashboard & UI

- [ ] Create dashboard stats API
- [ ] Create candidate dashboard
- [ ] Create recruiter dashboard
- [ ] Create admin dashboard
- [ ] Polish UI/UX
- [ ] Add loading states
- [ ] Add error handling
- [ ] Responsive design

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

- [ ] Apply vào job
- [ ] Match score hiển thị đúng
- [ ] Skills breakdown đúng
- [ ] Ranking candidates
- [ ] Update application status
- [ ] View application history

### Dashboard

- [ ] Candidate dashboard stats đúng
- [ ] Recruiter dashboard stats đúng
- [ ] Admin dashboard stats đúng

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
