# Phase 3: Run Migrations

## Context Links
- [Plan Overview](./plan.md)
- [Phase 2: Create Prisma Schema](./phase-02-create-prisma-schema.md)

## Overview

**Priority:** 🔴 Critical
**Status:** ⬜ Pending
**Thời gian ước tính:** 5 phút

Run Prisma migrations để tạo tables trong PostgreSQL database và generate Prisma Client.

## Requirements

### Functional Requirements
- Create tables từ schema
- Generate Prisma Client
- Migration history tracked

### Non-functional Requirements
- Idempotent migrations
- Rollback capability
- Type-safe client

## Related Code Files

### Files to Create
- `apps/api/prisma/migrations/` - Migration files

### Files to Generate
- `node_modules/.prisma/client/` - Generated Prisma Client

## Implementation Steps

### 1. Run First Migration

```bash
cd apps/api

# Create migration và apply
npx prisma migrate dev --name init
```

Lệnh này sẽ:
1. Create migration file trong `prisma/migrations/`
2. Apply migration vào database
3. Generate Prisma Client
4. Update `node_modules/.prisma/client/`

**Output:**
```
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "hr_recruitment_dev"

Applying migration `20260305_init`

The following migration(s) have been created and applied from new schema changes:

migrations/
  └─ 20260305_init/
      └─ migration.sql

Your database is now in sync with your schema.

✔ Generated Prisma Client
```

### 2. Verify Migration

```bash
# Check migration status
npx prisma migrate status

# View database schema
npx prisma db pull
```

### 3. Generate Prisma Client (Manual)

Nếu cần regenerate client:
```bash
npx prisma generate
```

### 4. Inspect Database

```bash
# Open Prisma Studio
npx prisma studio
```

Hoặc dùng psql:
```bash
psql -U hr_user -d hr_recruitment_dev

# List tables
\dt

# Describe table
\d "User"
```

## Todo List

- [ ] Verify DATABASE_URL trong .env
- [ ] Run `npx prisma migrate dev --name init`
- [ ] Check migration files created
- [ ] Verify tables created trong database
- [ ] Run `npx prisma generate`
- [ ] Test Prisma Client import
- [ ] Open Prisma Studio để inspect data

## Success Criteria

- [ ] Migration applied successfully
- [ ] All 6 tables created
- [ ] Prisma Client generated
- [ ] Can import PrismaClient trong code
- [ ] Prisma Studio opens và shows tables

## Migration Files

Migration file sẽ được tạo tại:
```
apps/api/prisma/migrations/
└── 20260305_init/
    └── migration.sql
```

**migration.sql** sẽ chứa:
- CREATE TABLE statements
- CREATE TYPE statements (enums)
- CREATE INDEX statements
- Foreign key constraints

## Testing Prisma Client

Tạo file test `apps/api/test-prisma.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Test connection
  await prisma.$connect();
  console.log('✓ Connected to database');

  // Count users
  const userCount = await prisma.user.count();
  console.log(`Users: ${userCount}`);

  await prisma.$disconnect();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
```

Run test:
```bash
npx ts-node test-prisma.ts
```

## Prisma Studio

Prisma Studio là GUI tool để inspect và edit data:

```bash
npx prisma studio
```

Opens at: http://localhost:5555

Features:
- Browse tables
- View/edit records
- Run queries
- Test relations

## Troubleshooting

### Migration failed: database does not exist
```bash
# Create database first
psql -U postgres -c "CREATE DATABASE hr_recruitment_dev;"
```

### Migration failed: permission denied
```bash
# Grant permissions
psql -U postgres -d hr_recruitment_dev -c "GRANT ALL PRIVILEGES ON SCHEMA public TO hr_user;"
```

### Cannot find module '@prisma/client'
```bash
# Regenerate client
npx prisma generate

# Or reinstall
npm install @prisma/client
```

### Migration out of sync
```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Or create new migration
npx prisma migrate dev
```

## Migration Commands Reference

```bash
# Create and apply migration
npx prisma migrate dev --name <name>

# Apply pending migrations (production)
npx prisma migrate deploy

# Check migration status
npx prisma migrate status

# Reset database (dev only)
npx prisma migrate reset

# Create migration without applying
npx prisma migrate dev --create-only

# Resolve migration issues
npx prisma migrate resolve
```

## Risk Assessment

**Risks:**
- Migration fails due to database connection
- Schema changes break existing data
- Prisma Client generation fails

**Mitigation:**
- Test connection before migration
- Backup database before major changes
- Use `--create-only` to review SQL first
- Keep migrations small and focused

## Next Steps

Sau khi hoàn thành phase này:
- Phase 4: Create Seed Data
- Test queries với Prisma Client
