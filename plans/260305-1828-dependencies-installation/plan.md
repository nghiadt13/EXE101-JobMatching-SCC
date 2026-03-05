# Kế Hoạch Cài Đặt Dependencies

**Timeline:** 1-2 giờ
**Status:** 🟡 Pending

## Tổng Quan

Cài đặt toàn bộ dependencies cần thiết cho HR Recruitment Platform theo đúng tech stack đã định nghĩa trong docs.

## Phases

### Phase 1: Monorepo Setup ⬜

**File:** [phase-01-monorepo-setup.md](./phase-01-monorepo-setup.md)
**Thời gian:** 15 phút

- Tạo npm workspaces trong package.json
- Tạo root package.json với shared scripts
- Cấu hình monorepo structure

### Phase 2: Backend Dependencies ⬜

**File:** [phase-02-backend-dependencies.md](./phase-02-backend-dependencies.md)
**Thời gian:** 20 phút

- Prisma ORM & PostgreSQL client
- Authentication (JWT, bcrypt, passport)
- Validation & transformation
- NestJS modules bổ sung

### Phase 3: Frontend Dependencies ⬜

**File:** [phase-03-frontend-dependencies.md](./phase-03-frontend-dependencies.md)
**Thời gian:** 20 phút

- NextAuth.js v5
- shadcn/ui components
- Form handling & validation
- HTTP client

### Phase 4: AI & Processing Dependencies ⬜

**File:** [phase-04-ai-processing-dependencies.md](./phase-04-ai-processing-dependencies.md)
**Thời gian:** 15 phút

- Gemini API client
- PDF/DOCX parsing
- TF-IDF matching (natural.js)

### Phase 5: Dev Dependencies & Config ⬜

**File:** [phase-05-dev-dependencies-config.md](./phase-05-dev-dependencies-config.md)
**Thời gian:** 15 phút

- ESLint & Prettier shared configs
- TypeScript configs
- Testing utilities

## Dependencies

- Không có dependencies giữa các phase
- Có thể cài song song nếu cần

## Success Criteria

- [ ] Tất cả packages cài đặt thành công
- [ ] `npm install` chạy không lỗi
- [ ] Monorepo structure hoạt động đúng
- [ ] Dev server có thể start (web + api)
- [ ] TypeScript compile không lỗi

## Notes

- Sử dụng npm thay vì npm/yarn
- Lock file sẽ được tạo tự động
- Kiểm tra version compatibility
