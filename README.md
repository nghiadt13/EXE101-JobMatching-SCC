# HR Recruitment Platform - MVP

Hệ thống tuyển dụng với AI matching giữa CV và Job Description.

## Tech Stack

- **Frontend:** Next.js 15 + TypeScript + Tailwind CSS + shadcn/ui
- **Backend:** NestJS + TypeScript + Prisma ORM
- **Database:** PostgreSQL
- **Auth:** NextAuth.js v5 (email/password)
- **AI:** Gemini API (CV parsing + matching)
- **Storage:** Local filesystem (MVP)

## Timeline

**1-2 tuần** - MVP localhost only

## Core Features

- ✅ Authentication (3 roles: Admin, Recruiter, Candidate)
- ✅ CV upload + AI parsing (Gemini)
- ✅ Job posting management
- ✅ TF-IDF matching algorithm
- ✅ Application flow
- ✅ Simple dashboard

## Project Structure

```
hr-recruitment-platform/
├── docs/                    # Documentation
├── apps/
│   ├── web/                # Next.js frontend
│   └── api/                # NestJS backend
└── README.md
```

## Quick Start

Xem chi tiết trong `docs/05-implementation-checklist.md`

## Documentation

1. [Tổng quan](docs/01-tong-quan.md)
2. [Database Schema](docs/02-database-schema.md)
3. [API Endpoints](docs/03-api-endpoints.md)
4. [Matching Algorithm](docs/04-matching-algorithm.md)
5. [Implementation Checklist](docs/05-implementation-checklist.md)
