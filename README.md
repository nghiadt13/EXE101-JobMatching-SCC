# HR Recruitment Platform - MVP

Hệ thống tuyển dụng MVP với AI matching giữa CV và Job Description.

## Tech Stack

- Frontend: Next.js 16 + TypeScript + Tailwind CSS
- Backend: NestJS + TypeScript + Prisma ORM
- Database: PostgreSQL
- Auth: NextAuth.js v5 (Credentials + JWT)
- AI: LLM Provider (Gemini or OpenAI - configurable via LLM_PROVIDER env)
- Storage: Local filesystem (MVP)

## Core Features

- Authentication + RBAC (Admin, Recruiter, Candidate)
- User/Profile management
- CV upload/parsing/edit/primary selection
- Job management lifecycle (Draft/Published/Closed)
- TF-IDF + skills matching
- Application flow (apply/review/status transitions)
- Role-based dashboard stats

## Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL 14+
- PowerShell (commands below assume PowerShell)

## Environment Setup

### 1. API (`apps/api`)

Required variables:

- `DATABASE_URL`
- `JWT_SECRET`
- `WEB_URL` (default `http://localhost:3000`)
- `PORT` (default `3001` recommended for local)
- `LLM_PROVIDER` (`gemini` or `openai`, default `gemini`)
- `GEMINI_API_KEY` (required when `LLM_PROVIDER=gemini`)
- `GEMINI_MODEL` (default `gemini-3.1-flash-lite-preview`)
- `OPENAI_API_KEY` (required when `LLM_PROVIDER=openai`)
- `OPENAI_MODEL` (default `gpt-4.1-mini`)

Example (PowerShell):

```powershell
$env:DATABASE_URL='postgresql://postgres:postgres@localhost:5432/postgres'
$env:JWT_SECRET='local-jwt-secret'
$env:WEB_URL='http://localhost:3000'
$env:PORT='3001'
$env:LLM_PROVIDER='gemini'
$env:GEMINI_API_KEY='your-gemini-api-key'
$env:GEMINI_MODEL='gemini-3.1-flash-lite-preview'
$env:OPENAI_API_KEY='your-openai-api-key'
$env:OPENAI_MODEL='gpt-4.1-mini'
```

AI parse workflow (current):

1. Extract text from source (`PDF/DOCX` for CV, form text for JD)
2. Send extracted text to the configured LLM provider (`gemini` or `openai`)
3. Normalize LLM JSON output to internal schema
4. Persist normalized payload for matching

If the LLM returns invalid JSON, or the extracted file content cannot be parsed, the API now fails explicitly with a parse error. If the configured provider is unavailable or misconfigured, the API returns a service-unavailable error instead of pretending the file was unreadable. The system no longer saves synthetic fallback parses.

API failures now use one shared error envelope with `statusCode`, `code`, `message`, `requestId`, `timestamp`, and `path`. The web upload flows surface the backend `message` plus `requestId`, so you can correlate a user-visible failure directly with backend logs.

### 2. Web (`apps/web`)

Required variables:

- `NEXT_PUBLIC_API_URL` (default `http://localhost:3001/api`)
- `AUTH_SECRET` (or `NEXTAUTH_SECRET`)

Example (PowerShell):

```powershell
$env:NEXT_PUBLIC_API_URL='http://localhost:3001/api'
$env:AUTH_SECRET='local-auth-secret'
```

## Install

```powershell
npm install
```

## Database Init + Seed

Run in `apps/api`:

```powershell
npx prisma migrate dev
npm run seed
```

Seed tạo sẵn dữ liệu demo deterministic cho 3 vai trò.

## Run Locally

Dùng 2 terminal.

Terminal 1 (API):

```powershell
npm run start:dev -w api
```

Terminal 2 (Web):

```powershell
npm run dev -w web
```

Open:

- Web: `http://localhost:3000`
- API: `http://localhost:3001/api`

## Demo Accounts

- Admin: `admin@example.com` / `password123`
- Recruiter A: `recruiter.alpha@example.com` / `password123`
- Recruiter B: `recruiter.beta@example.com` / `password123`
- Candidate Anna: `candidate.anna@example.com` / `password123`
- Candidate Bao: `candidate.bao@example.com` / `password123`

## Quality Gates

```powershell
npm run lint -w api
npm run test -w api -- --runInBand
npm run test:e2e -w api -- --runInBand
npm run build -w api
npm run lint -w web
$env:AUTH_SECRET='local-test-secret-for-build-only'; npm run build -w web
```

## Troubleshooting

- Error `JWT_SECRET is required`: thiếu env ở API terminal.
- Error `Missing AUTH_SECRET`: thiếu env ở Web terminal hoặc khi build web.
- Error kết nối DB: kiểm tra `DATABASE_URL`, DB service, và migration state.
- CORS lỗi khi login: kiểm tra `WEB_URL` ở API đúng với URL web.
- Dashboard/API data bất thường: rerun seed rồi restart API/Web.
- Upload/save failure needs root cause: capture the `Request ID` shown in the web banner, then grep API logs for that id.

## Documentation

1. [Tổng quan](docs/01-tong-quan.md)
2. [Database Schema](docs/02-database-schema.md)
3. [API Endpoints](docs/03-api-endpoints.md)
4. [Matching Algorithm](docs/04-matching-algorithm.md)
5. [Implementation Checklist](docs/05-implementation-checklist.md)
6. [Release Readiness Acceptance Matrix](docs/06-release-readiness-acceptance-matrix.md)
7. [MVP Demo Script](docs/07-mvp-demo-script.md)
