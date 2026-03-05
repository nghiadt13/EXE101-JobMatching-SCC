# Phase 2: Create Prisma Schema

## Context Links
- [Plan Overview](./plan.md)
- [Docs: Database Schema](../../docs/02-database-schema.md)

## Overview

**Priority:** 🔴 Critical
**Status:** ⬜ Pending
**Thời gian ước tính:** 15 phút

Tạo Prisma schema với 6 models, enums, relations và indexes theo design trong docs.

## Requirements

### Functional Requirements
- 6 models: User, Candidate, CV, Job, Application, Skill
- 3 enums: UserRole, JobStatus, ApplicationStatus
- Relations giữa các models
- Indexes cho performance
- Soft delete pattern

### Non-functional Requirements
- Type-safe database queries
- Auto-generated TypeScript types
- Support for JSONB fields
- UUID primary keys

## Related Code Files

### Files to Create
- `apps/api/prisma/schema.prisma`

## Implementation Steps

### 1. Init Prisma
```bash
cd apps/api
npx prisma init
```

Lệnh này sẽ tạo:
- `prisma/schema.prisma` - Schema file
- `.env` - Environment variables (nếu chưa có)

### 2. Create Schema File

Tạo file `apps/api/prisma/schema.prisma`:

```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// ENUMS
// ============================================

enum UserRole {
  ADMIN
  RECRUITER
  CANDIDATE
}

enum JobStatus {
  DRAFT
  PUBLISHED
  CLOSED
  ARCHIVED
}

enum ApplicationStatus {
  APPLIED
  REVIEWING
  INTERVIEW
  OFFER
  REJECTED
  WITHDRAWN
}

// ============================================
// MODELS
// ============================================

model User {
  id        String    @id @default(uuid())
  email     String    @unique
  password  String // bcrypt hashed
  name      String
  role      UserRole  @default(CANDIDATE)
  avatar    String?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime? // soft delete

  // Relations
  candidate Candidate?
  jobs      Job[]

  @@index([email])
  @@index([role])
  @@index([deletedAt])
}

model Candidate {
  id       String  @id @default(uuid())
  userId   String  @unique
  user     User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  phone    String?
  location Json? // { city, country }
  bio      String? @db.Text

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  cvs          CV[]
  applications Application[]

  @@index([userId])
}

model CV {
  id          String    @id @default(uuid())
  candidateId String
  candidate   Candidate @relation(fields: [candidateId], references: [id], onDelete: Cascade)

  fileName String
  filePath String
  fileSize Int
  mimeType String

  // Parsed data từ Gemini
  parsedData Json // { skills, experience, education, contact }
  skills     Json // ["Python", "Django", ...]

  isPrimary Boolean @default(false)

  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?

  // Relations
  applications Application[]

  @@index([candidateId])
  @@index([isPrimary])
  @@index([deletedAt])
}

model Job {
  id          String   @id @default(uuid())
  recruiterId String
  recruiter   User     @relation(fields: [recruiterId], references: [id], onDelete: Cascade)

  title       String
  slug        String   @unique
  description String   @db.Text

  // Job details
  skills         Json // ["Python", "Django", ...]
  location       Json? // { city, country, remote }
  salaryMin      Int?
  salaryMax      Int?
  employmentType String // FULL_TIME, PART_TIME, CONTRACT

  status      JobStatus @default(DRAFT)
  publishedAt DateTime?
  closedAt    DateTime?

  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?

  // Relations
  applications Application[]

  @@index([recruiterId])
  @@index([status])
  @@index([publishedAt])
  @@index([slug])
  @@index([deletedAt])
}

model Application {
  id          String   @id @default(uuid())
  jobId       String
  job         Job      @relation(fields: [jobId], references: [id], onDelete: Cascade)
  candidateId String
  candidate   Candidate @relation(fields: [candidateId], references: [id], onDelete: Cascade)
  cvId        String
  cv          CV       @relation(fields: [cvId], references: [id], onDelete: Restrict)

  // Matching scores
  matchScore  Float // 0-100
  tfidfScore  Float?
  skillsScore Float?

  status    ApplicationStatus @default(APPLIED)
  notes     String?           @db.Text

  appliedAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([jobId, candidateId]) // 1 candidate chỉ apply 1 lần/job
  @@index([jobId])
  @@index([candidateId])
  @@index([cvId])
  @@index([matchScore])
  @@index([status])
}

model Skill {
  id       String @id @default(uuid())
  name     String @unique
  category String // PROGRAMMING, FRAMEWORK, DATABASE, TOOL, SOFT_SKILL

  createdAt DateTime @default(now())

  @@index([name])
  @@index([category])
}
```

### 3. Verify Schema

```bash
# Format schema
npx prisma format

# Validate schema
npx prisma validate
```

## Todo List

- [ ] Run `npx prisma init`
- [ ] Create `schema.prisma` với 6 models
- [ ] Add 3 enums (UserRole, JobStatus, ApplicationStatus)
- [ ] Define relations giữa models
- [ ] Add indexes cho performance
- [ ] Add soft delete fields (deletedAt)
- [ ] Run `npx prisma format`
- [ ] Run `npx prisma validate`

## Success Criteria

- [ ] Schema file created
- [ ] Tất cả 6 models defined
- [ ] Relations configured đúng
- [ ] Indexes added
- [ ] `prisma validate` pass
- [ ] No syntax errors

## Schema Design Notes

### Relations
- **User → Candidate**: One-to-One (optional)
- **User → Job**: One-to-Many (recruiter)
- **Candidate → CV**: One-to-Many
- **Candidate → Application**: One-to-Many
- **Job → Application**: One-to-Many
- **CV → Application**: One-to-Many

### Cascade Deletes
- Delete User → Delete Candidate, Jobs
- Delete Candidate → Delete CVs, Applications
- Delete Job → Delete Applications
- Delete CV → **RESTRICT** (không cho delete nếu có applications)

### JSONB Fields
- `Candidate.location`: `{ city: string, country: string }`
- `CV.parsedData`: `{ skills, experience, education, contact }`
- `CV.skills`: `string[]`
- `Job.skills`: `string[]`
- `Job.location`: `{ city: string, country: string, remote: boolean }`

### Indexes Strategy
- Primary lookups: email, slug
- Foreign keys: userId, candidateId, jobId, cvId
- Filtering: role, status, isPrimary, deletedAt
- Sorting: matchScore, publishedAt

## Risk Assessment

**Risks:**
- Schema quá phức tạp cho MVP
- JSONB fields khó query
- Cascade deletes có thể xóa data không mong muốn

**Mitigation:**
- Keep schema simple, chỉ 6 models
- JSONB chỉ cho MVP, migrate sau
- Test cascade deletes carefully
- Add onDelete: Restrict cho CV → Application

## Next Steps

Sau khi hoàn thành phase này:
- Phase 3: Run Migrations
- Generate Prisma Client
