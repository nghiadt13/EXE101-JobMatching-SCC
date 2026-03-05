# Kế Hoạch: Setup Database & Prisma

**Timeline:** 30-45 phút
**Status:** 🟡 Pending

## Tổng Quan

Setup PostgreSQL database và Prisma ORM cho HR Recruitment Platform với 6 models chính.

## Phases

### Phase 1: Setup PostgreSQL Database ⬜
**File:** [phase-01-setup-postgresql.md](./phase-01-setup-postgresql.md)
**Thời gian:** 10 phút
- Cài PostgreSQL local hoặc setup Railway
- Tạo database
- Configure connection string

### Phase 2: Create Prisma Schema ⬜
**File:** [phase-02-create-prisma-schema.md](./phase-02-create-prisma-schema.md)
**Thời gian:** 15 phút
- Tạo schema.prisma với 6 models
- Define enums và relations
- Add indexes

### Phase 3: Run Migrations ⬜
**File:** [phase-03-run-migrations.md](./phase-03-run-migrations.md)
**Thời gian:** 5 phút
- Init Prisma
- Run first migration
- Generate Prisma Client

### Phase 4: Create Seed Data ⬜
**File:** [phase-04-create-seed-data.md](./phase-04-create-seed-data.md)
**Thời gian:** 10 phút
- Tạo seed script
- Add sample users, jobs, CVs
- Run seeder

### Phase 5: Setup Prisma Service ⬜
**File:** [phase-05-setup-prisma-service.md](./phase-05-setup-prisma-service.md)
**Thời gian:** 10 phút
- Tạo PrismaService trong NestJS
- Configure module
- Test connection

## Dependencies

- Phase 2 depends on Phase 1 (cần database URL)
- Phase 3 depends on Phase 2 (cần schema)
- Phase 4 depends on Phase 3 (cần tables)
- Phase 5 depends on Phase 3 (cần Prisma Client)

## Success Criteria

- [ ] PostgreSQL database running
- [ ] Prisma schema created với 6 models
- [ ] Migration chạy thành công
- [ ] Seed data được insert
- [ ] PrismaService hoạt động trong NestJS
- [ ] Có thể query database từ API

## Notes

- Sử dụng PostgreSQL (không phải MySQL)
- Soft delete pattern với deletedAt
- JSONB cho skills (MVP)
- UUID cho primary keys
