# Phase 1: Monorepo Setup

## Context Links

- [Plan Overview](./plan.md)
- [Docs: Implementation Checklist](../../docs/05-implementation-checklist.md)

## Overview

**Priority:** 🔴 Critical
**Status:** ⬜ Pending
**Thời gian ước tính:** 15 phút

Thiết lập cấu trúc monorepo với npm workspaces để quản lý 2 apps (web + api) trong cùng 1 repository.

## Requirements

### Functional Requirements

- Cấu hình npm workspaces để nhận diện apps/web và apps/api
- Tạo root package.json với shared scripts
- Đảm bảo dependencies có thể được cài từ root

### Non-functional Requirements

- Monorepo structure phải rõ ràng và dễ maintain
- Scripts phải hoạt động từ root directory
- Hỗ trợ parallel execution cho dev mode

## Architecture

```
hr-recruitment-platform/
├── npm workspaces trong package.json    # Workspace config
├── package.json           # Root package với shared scripts
├── apps/
│   ├── web/              # Next.js app
│   └── api/              # NestJS app
└── packages/             # (Future) Shared packages
```

## Related Code Files

### Files to Create

- `npm workspaces trong package.json`
- `package.json` (root)

### Files to Reference

- `apps/web/package.json`
- `apps/api/package.json`

## Implementation Steps

### 1. Tạo npm workspaces trong package.json

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

### 2. Tạo Root package.json

```json
{
  "name": "hr-recruitment-platform",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "npm run dev --workspaces --if-present",
    "dev:web": "npm -w web dev",
    "dev:api": "npm -w api start:dev",
    "build": "npm run build",
    "build:web": "npm -w web build",
    "build:api": "npm -w api build",
    "lint": "npm run lint",
    "test": "npm run test"
  },
  "devDependencies": {
    "prettier": "^3.4.2"
  }
}
```

### 3. Verify Workspace Structure

```bash
npm install
npm ls --depth 0
```

## Todo List

- [ ] Tạo file `npm workspaces trong package.json`
- [ ] Tạo root `package.json` với shared scripts
- [ ] Chạy `npm install` để verify
- [ ] Test script `npm run dev:web`
- [ ] Test script `npm run dev:api`
- [ ] Test parallel script `npm run dev`

## Success Criteria

- [ ] `npm install` chạy thành công không lỗi
- [ ] `npm ls` hiển thị đúng workspace structure
- [ ] Scripts từ root hoạt động đúng
- [ ] Có thể filter commands cho từng app
- [ ] Parallel execution hoạt động

## Risk Assessment

**Risks:**

- Conflict giữa dependencies của web và api
- Scripts không hoạt động trên Windows

**Mitigation:**

- Sử dụng npm workspace protocol
- Test scripts trên Windows bash shell
- Document các commands rõ ràng

## Next Steps

Sau khi hoàn thành phase này:

- Phase 2: Cài đặt Backend Dependencies
- Phase 3: Cài đặt Frontend Dependencies
