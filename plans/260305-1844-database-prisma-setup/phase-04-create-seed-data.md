# Phase 4: Create Seed Data

## Context Links
- [Plan Overview](./plan.md)
- [Phase 3: Run Migrations](./phase-03-run-migrations.md)

## Overview

**Priority:** 🟡 Medium
**Status:** ⬜ Pending
**Thời gian ước tính:** 10 phút

Tạo seed script để populate database với sample data cho development và testing.

## Requirements

### Functional Requirements
- Sample users (Admin, Recruiter, Candidate)
- Sample jobs
- Sample CVs
- Sample applications với match scores

### Non-functional Requirements
- Idempotent seeding (có thể run nhiều lần)
- Realistic data
- Proper relations

## Related Code Files

### Files to Create
- `apps/api/prisma/seed.ts` - Seed script

### Files to Modify
- `apps/api/package.json` - Add seed command

## Implementation Steps

### 1. Create Seed Script

Tạo file `apps/api/prisma/seed.ts`:

```typescript
import { PrismaClient, UserRole, JobStatus, ApplicationStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data (optional, for dev only)
  await prisma.application.deleteMany();
  await prisma.cV.deleteMany();
  await prisma.job.deleteMany();
  await prisma.candidate.deleteMany();
  await prisma.user.deleteMany();
  await prisma.skill.deleteMany();

  console.log('✓ Cleared existing data');

  // Hash password
  const hashedPassword = await bcrypt.hash('password123', 10);

  // 1. Create Users
  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'Admin User',
      role: UserRole.ADMIN,
    },
  });

  const recruiter = await prisma.user.create({
    data: {
      email: 'recruiter@example.com',
      password: hashedPassword,
      name: 'John Recruiter',
      role: UserRole.RECRUITER,
    },
  });

  const candidateUser = await prisma.user.create({
    data: {
      email: 'candidate@example.com',
      password: hashedPassword,
      name: 'Jane Candidate',
      role: UserRole.CANDIDATE,
    },
  });

  console.log('✓ Created users');

  // 2. Create Candidate Profile
  const candidate = await prisma.candidate.create({
    data: {
      userId: candidateUser.id,
      phone: '+84901234567',
      location: { city: 'Ho Chi Minh', country: 'Vietnam' },
      bio: 'Experienced software developer with 5 years in web development.',
    },
  });

  console.log('✓ Created candidate profile');

  // 3. Create CV
  const cv = await prisma.cV.create({
    data: {
      candidateId: candidate.id,
      fileName: 'jane-cv.pdf',
      filePath: '/uploads/cvs/jane-cv.pdf',
      fileSize: 1024000,
      mimeType: 'application/pdf',
      parsedData: {
        contact: {
          email: 'candidate@example.com',
          phone: '+84901234567',
        },
        experience: [
          {
            title: 'Senior Developer',
            company: 'Tech Corp',
            duration: '2020-2025',
            description: 'Led development of web applications',
          },
        ],
        education: [
          {
            degree: 'Bachelor of Computer Science',
            school: 'University of Technology',
            year: '2019',
          },
        ],
      },
      skills: ['Python', 'Django', 'PostgreSQL', 'React', 'TypeScript'],
      isPrimary: true,
    },
  });

  console.log('✓ Created CV');

  // 4. Create Jobs
  const job1 = await prisma.job.create({
    data: {
      recruiterId: recruiter.id,
      title: 'Senior Backend Developer',
      slug: 'senior-backend-developer',
      description: 'We are looking for an experienced backend developer...',
      skills: ['Python', 'Django', 'PostgreSQL', 'Docker'],
      location: { city: 'Ho Chi Minh', country: 'Vietnam', remote: false },
      salaryMin: 2000,
      salaryMax: 3000,
      employmentType: 'FULL_TIME',
      status: JobStatus.PUBLISHED,
      publishedAt: new Date(),
    },
  });

  const job2 = await prisma.job.create({
    data: {
      recruiterId: recruiter.id,
      title: 'Frontend Developer',
      slug: 'frontend-developer',
      description: 'Join our team to build amazing user interfaces...',
      skills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS'],
      location: { city: 'Ha Noi', country: 'Vietnam', remote: true },
      salaryMin: 1500,
      salaryMax: 2500,
      employmentType: 'FULL_TIME',
      status: JobStatus.PUBLISHED,
      publishedAt: new Date(),
    },
  });

  console.log('✓ Created jobs');

  // 5. Create Applications
  const application1 = await prisma.application.create({
    data: {
      jobId: job1.id,
      candidateId: candidate.id,
      cvId: cv.id,
      matchScore: 78.5,
      tfidfScore: 0.72,
      skillsScore: 0.85,
      status: ApplicationStatus.APPLIED,
    },
  });

  const application2 = await prisma.application.create({
    data: {
      jobId: job2.id,
      candidateId: candidate.id,
      cvId: cv.id,
      matchScore: 65.0,
      tfidfScore: 0.60,
      skillsScore: 0.70,
      status: ApplicationStatus.REVIEWING,
      notes: 'Good candidate, schedule interview',
    },
  });

  console.log('✓ Created applications');

  // 6. Create Skills Reference
  const skills = [
    { name: 'Python', category: 'PROGRAMMING' },
    { name: 'JavaScript', category: 'PROGRAMMING' },
    { name: 'TypeScript', category: 'PROGRAMMING' },
    { name: 'Django', category: 'FRAMEWORK' },
    { name: 'React', category: 'FRAMEWORK' },
    { name: 'Next.js', category: 'FRAMEWORK' },
    { name: 'PostgreSQL', category: 'DATABASE' },
    { name: 'MongoDB', category: 'DATABASE' },
    { name: 'Docker', category: 'TOOL' },
    { name: 'Git', category: 'TOOL' },
  ];

  await prisma.skill.createMany({
    data: skills,
  });

  console.log('✓ Created skills reference');

  console.log('🎉 Seed completed successfully!');
  console.log('\nTest accounts:');
  console.log('Admin: admin@example.com / password123');
  console.log('Recruiter: recruiter@example.com / password123');
  console.log('Candidate: candidate@example.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### 2. Add Seed Command

Update `apps/api/package.json`:

```json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  },
  "scripts": {
    "seed": "npx prisma db seed"
  }
}
```

### 3. Run Seed

```bash
cd apps/api

# Run seed
npm run seed

# Or directly
npx prisma db seed
```

## Todo List

- [ ] Create `prisma/seed.ts` file
- [ ] Add sample users (Admin, Recruiter, Candidate)
- [ ] Add sample candidate profile
- [ ] Add sample CV với parsed data
- [ ] Add sample jobs (2-3 jobs)
- [ ] Add sample applications với match scores
- [ ] Add skills reference data
- [ ] Update package.json với seed command
- [ ] Run seed script
- [ ] Verify data trong Prisma Studio

## Success Criteria

- [ ] Seed script runs without errors
- [ ] All sample data created
- [ ] Can login với test accounts
- [ ] Relations working correctly
- [ ] Data visible trong Prisma Studio

## Sample Data Summary

### Users (3)
- Admin: admin@example.com
- Recruiter: recruiter@example.com
- Candidate: candidate@example.com
- Password: password123 (bcrypt hashed)

### Candidate Profile (1)
- Linked to candidate user
- Phone, location, bio

### CV (1)
- Linked to candidate
- Parsed data với experience, education
- Skills: Python, Django, PostgreSQL, React, TypeScript

### Jobs (2)
- Senior Backend Developer (Python, Django)
- Frontend Developer (React, TypeScript)
- Both PUBLISHED

### Applications (2)
- Candidate applied to both jobs
- Match scores: 78.5% và 65%
- Different statuses

### Skills (10)
- Programming languages
- Frameworks
- Databases
- Tools

## Testing Seed Data

```bash
# Open Prisma Studio
npx prisma studio

# Or query via psql
psql -U hr_user -d hr_recruitment_dev

# Count records
SELECT 'users' as table_name, COUNT(*) FROM "User"
UNION ALL
SELECT 'candidates', COUNT(*) FROM "Candidate"
UNION ALL
SELECT 'cvs', COUNT(*) FROM "CV"
UNION ALL
SELECT 'jobs', COUNT(*) FROM "Job"
UNION ALL
SELECT 'applications', COUNT(*) FROM "Application"
UNION ALL
SELECT 'skills', COUNT(*) FROM "Skill";
```

## Resetting Data

```bash
# Clear and reseed
npx prisma migrate reset

# This will:
# 1. Drop database
# 2. Create database
# 3. Run migrations
# 4. Run seed
```

## Risk Assessment

**Risks:**
- Seed script fails due to constraint violations
- Duplicate data if run multiple times
- Passwords not hashed properly

**Mitigation:**
- Clear existing data first
- Use upsert for idempotent seeding
- Always hash passwords với bcrypt
- Test seed script thoroughly

## Next Steps

Sau khi hoàn thành phase này:
- Phase 5: Setup Prisma Service trong NestJS
- Test authentication với seeded users
