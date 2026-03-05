# Database Schema

## Tổng Quan

**6 tables chính** cho MVP:

- users
- jobs
- candidates
- cvs
- applications
- skills (reference only)

## Schema Chi Tiết

### 1. users

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String   // bcrypt hashed
  name      String
  role      UserRole @default(CANDIDATE)
  avatar    String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime? // soft delete

  candidate Candidate?
  jobs      Job[]
}

enum UserRole {
  ADMIN
  RECRUITER
  CANDIDATE
}
```

### 2. candidates

```prisma
model Candidate {
  id        String   @id @default(uuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id])

  phone     String?
  location  Json?    // { city, country }
  bio       String?

  cvs          CV[]
  applications Application[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### 3. cvs

```prisma
model CV {
  id          String   @id @default(uuid())
  candidateId String
  candidate   Candidate @relation(fields: [candidateId], references: [id])

  fileName    String
  filePath    String
  fileSize    Int
  mimeType    String

  // Parsed data từ Gemini
  parsedData  Json     // { skills, experience, education, contact }
  skills      Json     // ["Python", "Django", ...]

  isPrimary   Boolean  @default(false)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deletedAt   DateTime?
}
```

### 4. jobs

```prisma
model Job {
  id          String   @id @default(uuid())
  recruiterId String
  recruiter   User     @relation(fields: [recruiterId], references: [id])

  title       String
  slug        String   @unique
  description String   @db.Text

  // Job details
  skills      Json     // ["Python", "Django", ...]
  location    Json?    // { city, country, remote }
  salaryMin   Int?
  salaryMax   Int?
  employmentType String // FULL_TIME, PART_TIME, CONTRACT

  status      JobStatus @default(DRAFT)
  publishedAt DateTime?
  closedAt    DateTime?

  applications Application[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deletedAt   DateTime?
}

enum JobStatus {
  DRAFT
  PUBLISHED
  CLOSED
  ARCHIVED
}
```

### 5. applications

```prisma
model Application {
  id          String   @id @default(uuid())
  jobId       String
  job         Job      @relation(fields: [jobId], references: [id])
  candidateId String
  candidate   Candidate @relation(fields: [candidateId], references: [id])
  cvId        String

  // Matching scores
  matchScore  Float    // 0-100
  tfidfScore  Float?
  skillsScore Float?

  status      ApplicationStatus @default(APPLIED)
  notes       String?  @db.Text

  appliedAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([jobId, candidateId]) // 1 candidate chỉ apply 1 lần/job
}

enum ApplicationStatus {
  APPLIED
  REVIEWING
  INTERVIEW
  OFFER
  REJECTED
  WITHDRAWN
}
```

### 6. skills (Reference)

```prisma
model Skill {
  id       String @id @default(uuid())
  name     String @unique
  category String // PROGRAMMING, FRAMEWORK, DATABASE, TOOL, SOFT_SKILL

  createdAt DateTime @default(now())
}
```

## Indexes

```prisma
// users
@@index([email])
@@index([role])
@@index([deletedAt])

// jobs
@@index([recruiterId])
@@index([status])
@@index([publishedAt])
@@index([deletedAt])

// applications
@@index([jobId])
@@index([candidateId])
@@index([matchScore])
@@index([status])

// cvs
@@index([candidateId])
@@index([isPrimary])
```

## Migration Strategy

### Phase 1 (MVP)

- Skills lưu trong JSONB
- Đơn giản, nhanh implement

### Phase 2 (Future)

- Migrate sang normalized skills tables
- Thêm job_skills, candidate_skills junction tables
- Tốt hơn cho matching accuracy
