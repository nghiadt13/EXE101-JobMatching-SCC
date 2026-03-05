# Phase 2: Backend Dependencies

## Context Links

- [Plan Overview](./plan.md)
- [Docs: Database Schema](../../docs/02-database-schema.md)
- [Docs: API Endpoints](../../docs/03-api-endpoints.md)

## Overview

**Priority:** 🔴 Critical
**Status:** ⬜ Pending
**Thời gian ước tính:** 20 phút

Cài đặt tất cả dependencies cần thiết cho NestJS backend bao gồm Prisma, authentication, validation và các modules bổ sung.

## Requirements

### Functional Requirements

- Prisma ORM cho database operations
- JWT authentication với Passport
- Validation và transformation cho DTOs
- CORS support cho frontend connection

### Non-functional Requirements

- Type-safe database queries
- Secure password hashing
- Request validation tự động
- API documentation support

## Architecture

```
apps/api/
├── src/
│   ├── prisma/          # Prisma client
│   ├── auth/            # JWT, Passport strategies
│   ├── users/           # User CRUD
│   ├── jobs/            # Job management
│   ├── cvs/             # CV processing
│   └── applications/    # Application matching
└── package.json
```

## Related Code Files

### Files to Modify

- `apps/api/package.json`

### Files to Create (Later)

- `apps/api/prisma/schema.prisma`
- `apps/api/.env`

## Implementation Steps

### 1. Prisma & Database

```bash
cd apps/api
npm install prisma @prisma/client
npm install -D prisma
```

**Packages:**

- `@prisma/client` - Prisma client cho queries
- `prisma` - Prisma CLI

### 2. Authentication & Security

```bash
npm install @nestjs/passport @nestjs/jwt passport passport-jwt bcrypt
npm install -D @types/passport-jwt @types/bcrypt
```

**Packages:**

- `@nestjs/passport` - NestJS Passport integration
- `@nestjs/jwt` - JWT module
- `passport-jwt` - JWT strategy
- `bcrypt` - Password hashing

### 3. Validation & Transformation

```bash
npm install class-validator class-transformer
```

**Packages:**

- `class-validator` - DTO validation decorators
- `class-transformer` - Object transformation

### 4. Configuration & CORS

```bash
npm install @nestjs/config
```

**Packages:**

- `@nestjs/config` - Environment variables management

### 5. API Documentation (Optional)

```bash
npm install @nestjs/swagger
```

**Packages:**

- `@nestjs/swagger` - OpenAPI/Swagger documentation

## Todo List

- [ ] Cài Prisma và Prisma Client
- [ ] Cài authentication packages (Passport, JWT, bcrypt)
- [ ] Cài validation packages (class-validator, class-transformer)
- [ ] Cài @nestjs/config
- [ ] Cài @nestjs/swagger (optional)
- [ ] Verify tất cả packages trong package.json
- [ ] Chạy `npm install` để update lock file

## Success Criteria

- [ ] Tất cả packages cài đặt thành công
- [ ] Không có peer dependency warnings
- [ ] TypeScript types available cho tất cả packages
- [ ] `npm run build` compile thành công
- [ ] Dev server có thể start

## Dependencies Version

```json
{
  "dependencies": {
    "@nestjs/common": "^11.0.1",
    "@nestjs/core": "^11.0.1",
    "@nestjs/platform-express": "^11.0.1",
    "@nestjs/config": "^3.2.0",
    "@nestjs/passport": "^10.0.3",
    "@nestjs/jwt": "^10.2.0",
    "@nestjs/swagger": "^8.0.0",
    "@prisma/client": "^6.1.0",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "bcrypt": "^5.1.1",
    "class-validator": "^0.14.1",
    "class-transformer": "^0.5.1",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.1"
  },
  "devDependencies": {
    "@types/passport-jwt": "^4.0.1",
    "@types/bcrypt": "^5.0.2",
    "prisma": "^6.1.0"
  }
}
```

## Risk Assessment

**Risks:**

- Version conflicts giữa NestJS packages
- bcrypt compilation issues trên Windows
- Prisma client generation failures

**Mitigation:**

- Sử dụng compatible versions
- Có thể dùng bcryptjs nếu bcrypt fail
- Chạy `prisma generate` sau khi setup schema

## Next Steps

Sau khi hoàn thành phase này:

- Phase 3: Cài đặt Frontend Dependencies
- Setup Prisma schema và run migration
